import { createAsyncThunk } from "@reduxjs/toolkit";
import { CRUDBase } from "../../utils/CRUDBase";


export class BaseAsyncThunk<T> {

  CRUDBase: CRUDBase<T>;
  constructor(protected name: string) {
    this.CRUDBase = new CRUDBase<T>(name);
  }

  // if api has params or customs header please override this method
  getAll = createAsyncThunk(`${this.name}/getAll`, async () => {
    const entities = await this.CRUDBase.getAll();
    return entities;
  });


  // if api has params or customs header please override this method
  getById = createAsyncThunk(`${this.name}/getById`, async (id: string) => {
    const response = await this.CRUDBase.getById(id);
    return response;
  });


  // if api has params or customs header please override this method
  create = createAsyncThunk(`${this.name}/create`, async (data: T) => {
    const response = await this.CRUDBase.create(data);
    return response;
  });

  // if api has params or customs header please override this method
  update = createAsyncThunk(`${this.name}/update`, async ({ id, data }: any) => {
    const response = await this.CRUDBase.update(id, data);
    return response;
  });

  // if api has params or customs header please override this method
  delete = createAsyncThunk(`${this.name}/delete`, async (id: string) => {
    const response = await this.CRUDBase.delete(id);
    return response;
  });


}