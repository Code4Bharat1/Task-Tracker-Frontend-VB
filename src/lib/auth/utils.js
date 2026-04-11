export function getRedirectPath(role) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "department_head":
      return "/dept-head/dashboard";
    case "employee":
      return "/employee/dashboard";
    default:
      return "/login";
  }
}

export function getProjectDetailPath(projectId) {
  return `/employee/projects/${projectId}`;
}
