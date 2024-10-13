import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import {
  allUsers,
  fetchConstTaskDetail,
  taskTemplates,
  taskTemplatesToSelectData,
  usersToSelectData,
} from './common/stubs';
import { Controller, useForm } from 'react-smol-form';
import * as z from 'zod';

// ui library components should be wrapped in React.memo
import {
  Select,
  TextInput,
  Textarea,
  DateInput,
  Button,
  MultiSelect,
} from './common/wrapped-mantine';

// グローバルマップのカスタマイズ
// 間違って null が入ってたら必須エラー
const errorMap: z.ZodErrorMap = (error, ctx) => {
  switch (error.code) {
    case z.ZodIssueCode.invalid_type:
      if (error.received === 'null') {
        return { message: 'Required' };
      }
      break;
  }
  return { message: ctx.defaultError };
};
z.setErrorMap(errorMap);

const titleMaxLength = 8;
const descriptionMaxLength = 20;

// zod のスキーマは初期値を考慮せずに正しい型を書く
const formSchema = z
  .object({
    title: z.string().max(titleMaxLength).min(1, 'Required'),
    description: z.string().max(descriptionMaxLength),
    userIdAssingnedTo: z.string(),
    userIdVerifiedBy: z.string().nullable(),
    userIdInvolvedArray: z.array(z.string()).min(1, 'Required'),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
    endCondition: z.string(),
  })
  .refine(refineUsers, {
    message: 'Assigned user and approver must be different',
    path: ['userIdAssingnedTo'],
  })
  .refine(refineUsers, {
    message: 'Assigned user and approver must be different',
    path: ['userIdVerifiedBy'],
  })
  .refine(
    ({ endDate, endCondition }) => {
      if (endDate == null && endCondition === '') {
        return false;
      }
      return true;
    },
    {
      message: 'If the end date is undetermined, end conditions are required.',
      path: ['endCondition'],
    }
  );

function refineUsers({
  userIdAssingnedTo,
  userIdVerifiedBy,
}: {
  userIdAssingnedTo: string | null;
  userIdVerifiedBy: string | null;
}) {
  if (userIdAssingnedTo != null && userIdVerifiedBy != null) {
    if (userIdAssingnedTo === userIdVerifiedBy) {
      return false;
    }
  }
  return true;
}

type ValidFormValues = z.infer<typeof formSchema>;

export default function ComplexForm() {
  const { values, setValues, fieldsChanged, setFieldsChanged, control } =
    useForm<SetNullable<ValidFormValues, 'userIdAssingnedTo'>>({
      // 初期値で null が必要な場合はここでセットする
      initialValues: {
        title: '',
        description: '',
        userIdAssingnedTo: null,
        userIdVerifiedBy: null,
        userIdInvolvedArray: [],
        startDate: null,
        endDate: null,
        endCondition: '',
      },
    });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  useConfirmBeforeUnload(hasFieldsChanged(fieldsChanged));

  // validate all fields on render
  const fieldsErrors = useMemo(() => {
    const result = formSchema.safeParse(values);
    if (!result.success) {
      return result.error.format();
    }
  }, [values]);

  // API Sync
  const queryConstTaskDetail = useQuery({
    queryKey: ['ConstTaskDetail'],
    queryFn: () => {
      return fetchConstTaskDetail;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (queryConstTaskDetail.data == null) return;
    const d = queryConstTaskDetail.data;
    setValues({
      title: d.title,
      description: d.description ?? '',
      userIdAssingnedTo:
        d.user_assingned_to?.id == null
          ? null
          : String(d.user_assingned_to?.id),
      userIdVerifiedBy:
        d.user_verified_by?.id == null ? null : String(d.user_verified_by?.id),
      userIdInvolvedArray: d.user_involved_array.map((x) => String(x.id)),
      startDate:
        d.start_date == null
          ? null
          : dayjs(d.start_date, 'YYYY-MM-DD').toDate(),
      endDate:
        d.end_date == null ? null : dayjs(d.end_date, 'YYYY-MM-DD').toDate(),
      endCondition: d.end_condition ?? '',
    });
  }, [queryConstTaskDetail.data, setValues]);

  const optionUsers = usersToSelectData(allUsers);

  const optionTaskTemplates = taskTemplatesToSelectData(taskTemplates);

  const onChangeTemplate = useCallback(
    (value: string | null) => {
      setSelectedTemplateId(value);
      const selectedTemplate = taskTemplates.find(
        (template) => String(template.id) === value
      );
      setValues((values) => {
        return {
          ...values,
          title: selectedTemplate?.title ?? '',
          description: selectedTemplate?.description ?? '',
        };
      });
      setFieldsChanged((prev) => {
        return {
          ...prev,
          title: true,
          description: true,
        };
      });
    },
    [setValues, setFieldsChanged]
  );

  const onPost = useCallback(() => {
    setIsSubmitted(true);
    const isValid = fieldsErrors == null;
    if (!isValid) {
      alert(`Errors:\n${JSON.stringify(fieldsErrors, null, 2)}`);
      return;
    }
    const payload = formValuesToPayload(values as ValidFormValues);
    alert(`Submit:\n${JSON.stringify(payload, null, 2)}`);
  }, [values, fieldsErrors]);

  /** show validation mesasges if isChanged or isSubmitted  */
  const getErr = (isChanged: boolean, name: keyof ValidFormValues) => {
    return isChanged || isSubmitted
      ? fieldsErrors?.[name]?._errors.join(', ')
      : undefined;
  };

  return (
    <div>
      <div style={{ marginBlock: 16 }}>Edit task</div>
      {queryConstTaskDetail.isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={{ marginBlock: 16 }}>
            <Select
              label="Choose a template"
              data={optionTaskTemplates}
              searchable
              clearable
              nothingFound="No options"
              value={selectedTemplateId}
              onChange={onChangeTemplate}
            />
          </div>
          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="title"
              transform={(e: ChangeEvent<HTMLInputElement>) => {
                return e.target.value;
              }}
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <TextInput
                    label="Title"
                    withAsterisk
                    value={value}
                    error={getErr(isChanged, name)}
                    onChange={onChange}
                    maxLength={titleMaxLength + 1}
                  />
                );
              }}
            />
          </div>
          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="description"
              transform={(e: ChangeEvent<HTMLTextAreaElement>) => {
                return e.target.value;
              }}
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <Textarea
                    label="Description"
                    value={value}
                    onChange={onChange}
                    maxLength={descriptionMaxLength + 1}
                    error={getErr(isChanged, name)}
                  />
                );
              }}
            />
          </div>
          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="userIdAssingnedTo"
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <Select
                    label="Assigned user"
                    data={optionUsers}
                    searchable
                    clearable
                    nothingFound="No options"
                    value={value}
                    onChange={onChange}
                    error={getErr(isChanged, name)}
                  />
                );
              }}
            />
          </div>

          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="userIdVerifiedBy"
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <Select
                    label="Approver"
                    data={optionUsers}
                    searchable
                    clearable
                    nothingFound="No options"
                    value={value}
                    onChange={onChange}
                    error={getErr(isChanged, name)}
                  />
                );
              }}
            />
          </div>
          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="userIdInvolvedArray"
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <MultiSelect
                    label="Involved users"
                    data={optionUsers}
                    searchable
                    clearable
                    nothingFound="No options"
                    value={value}
                    onChange={onChange}
                    error={getErr(isChanged, name)}
                  />
                );
              }}
            />
          </div>
          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="startDate"
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <DateInput
                    label="Start date"
                    valueFormat="YYYY/MM/DD"
                    clearable
                    value={value}
                    maxDate={values.endDate ?? undefined}
                    onChange={onChange}
                    error={getErr(isChanged, name)}
                  />
                );
              }}
            />
          </div>
          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="endDate"
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <DateInput
                    label="End date"
                    valueFormat="YYYY/MM/DD"
                    clearable
                    value={value}
                    minDate={values.startDate ?? undefined}
                    onChange={onChange}
                    error={getErr(isChanged, name)}
                  />
                );
              }}
            />
          </div>
          <div style={{ marginBlock: 16 }}>
            <Controller
              control={control}
              name="endCondition"
              transform={(e: ChangeEvent<HTMLTextAreaElement>) => {
                return e.currentTarget.value;
              }}
              render={({ value, name, isChanged, onChange }) => {
                return (
                  <Textarea
                    label="End Condtion"
                    value={value}
                    onChange={onChange}
                    error={getErr(isChanged, name)}
                    withAsterisk={values.endDate == null}
                  />
                );
              }}
            />
          </div>
          <div>
            <Button onClick={onPost}>Save</Button>
          </div>
        </>
      )}
    </div>
  );
}

function formValuesToPayload(formValues: ValidFormValues): TaskPatchPayload {
  return {
    title: formValues.title,
    description: formValues.description || null,
    user_id_assingned_to: Number(formValues.userIdAssingnedTo),
    user_id_verified_by:
      formValues.userIdVerifiedBy == null
        ? null
        : Number(formValues.userIdVerifiedBy),
    start_date:
      formValues.startDate == null
        ? null
        : dayjs(formValues.startDate).format('YYYY-MM-DD'),
    end_date:
      formValues.endDate == null
        ? null
        : dayjs(formValues.endDate).format('YYYY-MM-DD'),
    end_condition: formValues.endCondition || null,
  };
}

function hasFieldsChanged(fieldsChanged: Record<string, boolean>) {
  return Object.values(fieldsChanged).some((v) => v);
}

export function useConfirmBeforeUnload(shouldConfirm: boolean) {
  useEffect(() => {
    if (!shouldConfirm) return;

    const f = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', f);
    return () => {
      removeEventListener('beforeunload', f);
    };
  }, [shouldConfirm]);
}

type SetNullable<
  TObject extends Record<string, any>,
  TNullableKeys extends keyof TObject
> = {
  [P in keyof TObject]: P extends TNullableKeys
    ? TObject[P] | null
    : TObject[P];
};
