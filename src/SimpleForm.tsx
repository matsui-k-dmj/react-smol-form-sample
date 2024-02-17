import { ChangeEvent } from 'react';
import { useForm, Controller } from 'react-smol-form';

type FormValues = {
  title: string;
  description: string;
};

export function SimpleForm() {
  const { control, values, fieldsChanged, fieldsBlurred } = useForm<FormValues>(
    {
      initialValues: {
        title: '',
        description: '',
      },
    }
  );
  return (
    <div>
      values:
      <pre>{JSON.stringify(values, null, 2)}</pre>
      fieldsChanged:
      <pre>{JSON.stringify(fieldsChanged, null, 2)}</pre>
      fieldsBlurred:
      <pre>{JSON.stringify(fieldsBlurred, null, 2)}</pre>
      <Controller
        control={control}
        name="title"
        transform={(e: ChangeEvent<HTMLInputElement>) => {
          return e.target.value;
        }}
        render={({ value, onChange, onBlur }) => {
          return (
            <div style={{ marginTop: 10 }}>
              <label>
                title <br />
                <input value={value} onChange={onChange} onBlur={onBlur} />
              </label>
            </div>
          );
        }}
      />
      <Controller
        control={control}
        name="description"
        transform={(e: ChangeEvent<HTMLInputElement>) => {
          return e.target.value;
        }}
        render={({ value, onChange, onBlur }) => {
          return (
            <div style={{ marginTop: 10 }}>
              <label>
                description <br />
                <input value={value} onChange={onChange} onBlur={onBlur} />
              </label>
            </div>
          );
        }}
      />
    </div>
  );
}
