export const allUsers: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

export const taskTemplates: TaskTemplate[] = [
  { id: 1, title: 'Deploy', description: 'Deploy to prod' },
  { id: 2, title: 'Manual test', description: '' },
];

const constResponse: TaskDetail = {
  id: 1,
  title: 'Debug',
  user_assingned_to: allUsers[4],
  start_date: '2023-05-12',
  user_involved_array: allUsers.slice(0, 2),
};

export const fetchConstTaskDetail = new Promise<TaskDetail>((resolve) =>
  setTimeout(() => {
    resolve(constResponse);
  }, 500)
);

export function usersToSelectData(users: User[]) {
  return users.map((user) => ({ value: String(user.id), label: user.name }));
}

export function taskTemplatesToSelectData(templates: TaskTemplate[]) {
  return templates.map((template) => ({
    value: String(template.id),
    label: template.title,
  }));
}
