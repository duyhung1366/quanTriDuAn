import { del, patch, post, RequestData, ResponseData } from "./request";
import { get } from "./request";
export class CRUDBase<T> {

  constructor(private name: string) {
    this.name = `/${this.name.toLowerCase()}`;
  }
  // get all
  public async getAll(params: any = {}, options?: RequestData): Promise<ResponseData<Array<T>>> {
    const response = await get({ endpoint: this.name, ...options, params: { ...params } });
    return response;
  }

  // get by id
  public async getById(id: string, params: any = {}, options?: RequestData): Promise<ResponseData<T>> {
    const response = await get({ endpoint: `${this.name}/${id}`, ...options, ...params });
    return response;
  }

  public async getTaskAssignmentById(id: string, params: any = {}, options?: RequestData): Promise<ResponseData<Array<T>>> {
    const response = await get({ endpoint: `${this.name}/${id}/assignees`, ...options, ...params });
    return response;
  }

  public async getProjectCheckListByParentId(id: string, params: any = {}, options?: RequestData): Promise<ResponseData<Array<T>>> {
    const response = await get({ endpoint: `${this.name}/${id}`, ...options, ...params });
    return response;
  }
  // 

  public async deleteItemCheckList(projectCheckListById: string, itemId: string, params: any = {}, options?: RequestData): Promise<ResponseData<Array<T>>> {
    const response = await del({ endpoint: `${this.name}/${projectCheckListById}/${itemId}`, ...options, ...params });
    return response;
  }

  public async updateItemCheckList(projectCheckListid: string, itemId: string, data: any, params: any = {}, options?: RequestData): Promise<ResponseData<Array<T>>> {
    const response = await patch({ endpoint: `${this.name}/${projectCheckListid}/${itemId}`, ...options, ...params, body: data });
    return response;
  }







  public async deleteTaskAssignment(data: any, taskId: string, role: number, params: any = {}, options?: RequestData): Promise<ResponseData<T>> {
    const response = await post({ endpoint: `${this.name}/${taskId}/unassign`, ...options, ...params, body: { userId: data, role } });
    return response;
  }



  // update
  public async update(id: string, data: any, params: any = {}, options?: RequestData): Promise<ResponseData<T>> {
    if (typeof (data) === "object" && !Object.keys(data).length) {
      data = {};
    }
    const response = await patch({ endpoint: `${this.name}/${id}`, ...options, ...params, body: data });
    return response;
  }
  // create
  public async create(data: any, params: any = {}, options?: RequestData): Promise<ResponseData<T>> {
    if (typeof (data) === "object" && !Object.keys(data).length) {
      data = {};
    }
    // const { taskId, projectId, userId, sprintId, discordId, nameUserAssign } = data

    // if (taskId && projectId && userId && sprintId && discordId && nameUserAssign) {
    //   const response = await post({ endpoint: `${this.name}/${data.taskId}/assign`, ...options, ...params, body: data });
    //   return response;
    // }
    const response = await post({ endpoint: `${this.name}`, ...options, ...params, body: data });
    return response;
  }
  // delete
  public async delete(id: string, params: any = {}, options?: RequestData): Promise<ResponseData<T>> {

    const response = await del({ endpoint: `${this.name}/${id}`, ...options, ...params });
    return response;
  }
}