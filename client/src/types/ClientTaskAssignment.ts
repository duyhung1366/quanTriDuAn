import TaskAssignment from "../../../common/models/task_assignment";

export class ClientTaskAssignment extends TaskAssignment {
    nameStatusTask?: string;
    discordId?: string;
    nameUserAssign?: string;
    idUserAssign?: string;
    constructor(args: any = {}) {
        super(args);
        this.nameStatusTask = args.nameStatusTask;
        this.discordId = args.discordId;
        this.nameUserAssign = args.nameUserAssign;
        this.idUserAssign = args.idUserAssign;
    }
}