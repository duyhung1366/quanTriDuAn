export const PWD_DECRYPT_KEY = "TbEQb0TDG9D64Xt544xLFofSBmxtJ7l6";

export enum LoginCode {
  FAILED = -1,
  SUCCESS = 0,
  ACCOUNT_IS_USED = 1,
  ACCOUNT_NOT_EXISTS = 2,
  WRONG_PWD = 3,
  FORBIDDEN = 7,
  TOKEN_INVALID = 8
}

export enum ProjectRole {
  OWNER = 0,
  SPRINT_MASTER = 1,
  SPRINT_MEMBER = 2
}

export enum SprintStatus {
  ARCHIVED = -1,
  ACTIVE = 0,
  UP_COMING = 1
}

export enum TaskStatus {
  OPEN = 0,
  IN_PROGRESS = 1,
  REVIEW = 2,
  BUG = 3,
  COMPLETE = 4
}

export enum TaskStatusStage {
  REVIEW_DEFAULT = 0,
  REVIEW_TESTING = 1,
  REVIEW_PROD_VALIDATION = 2
}

export enum TaskDifficulty {
  CRITICAL = 0,
  MAJOR = 1,
  MINOR = 2,
  TRIVIAL = 3,

}

export enum TaskPriority {
  URGENT = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

export enum TaskRole {
  ASSIGNEE = 0,
  REVIEWER = 1,
  TESTER = 2
}

export enum TaskCheckBug {
  TASK = 0,
  TASK_BUG = 1
}


export const SHOW_ARCHIVE_SPRINT = "showArchivedSprint";
