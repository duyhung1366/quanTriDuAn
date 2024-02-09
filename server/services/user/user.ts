import User from "../../../common/models/user";
import { externalRequest } from "../../utils/apiUtils";

export default class UserService {
  static async listUsers(): Promise<User[]> {
    const EndpointUsers = process.env.ENDPOINT_USERS || "https://me.koolsoftelearning.com";
    if (!EndpointUsers) return [];
    const {
      data, error
    } = await externalRequest({
      endpoint: `${EndpointUsers}/api/users`
    });
    return error ? [] : data;
  }
}