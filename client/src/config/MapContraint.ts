import { TaskRole, TaskStatus } from "../../../common/constants";
import { TaskPriority } from "../../../common/constants";
import { TaskDifficulty } from "../../../common/constants";



export const mapTaskStatusLabel = {
    [TaskStatus.OPEN]: "To Do",
    [TaskStatus.IN_PROGRESS]: "In Progress",
    [TaskStatus.REVIEW]: "Review",
    [TaskStatus.BUG]: "Bug",
    [TaskStatus.COMPLETE]: "Complete"
}


export const mapTaskPriorityLabel = {
    [TaskPriority.URGENT]: "Urgent",
    [TaskPriority.HIGH]: "High",
    [TaskPriority.MEDIUM]: "Normal",
    [TaskPriority.LOW]: "Low",
}

export const mapTaskDifficultyLabel = {
    [TaskDifficulty.CRITICAL]: "Critical",
    [TaskDifficulty.MAJOR]: "Major",
    [TaskDifficulty.MINOR]: "Minor",
    [TaskDifficulty.TRIVIAL]: "Trivial",
}

export const mapTaskRoleName = {
    [TaskRole.ASSIGNEE]: "Assignee",
    [TaskRole.REVIEWER]: "Reviewer",
    [TaskRole.TESTER]: "Tester"
}
