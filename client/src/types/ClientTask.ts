import { TaskRole } from "../../../common/constants";
import Project from "../../../common/models/project";
import Sprint from "../../../common/models/sprint";
import Task from "../../../common/models/task";
import TaskAssignment from "../../../common/models/task_assignment";

export interface ClientTask extends Task {
  assignments?: Array<TaskAssignment>;
}
interface Assignment {
  userId: string,
  role: TaskRole
}
export interface TaskDashboard extends Task {
  taskAssignments?: Array<Assignment>;
  subTasks?: Array<Task & { taskAssignments?: Array<Assignment> }>
  project?: Pick<Project, "name">;
  sprint?: Pick<Sprint, "name">;
}

