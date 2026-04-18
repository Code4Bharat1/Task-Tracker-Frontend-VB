export function getRedirectPath(role) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "super_admin":
      return "/admin/dashboard";
    case "department_head":
      return "/dept-head/dashboard";
    case "lead":
    case "contributor":
    case "reviewer":
    case "employee":
    case "developer":
    case "tester":
    case "project_manager":
      return "/employee/dashboard";
    default:
      return "/employee/dashboard";
  }
}

export function getProjectDetailPath(projectId) {
  return `/employee/projects/${projectId}`;
}
