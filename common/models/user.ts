export default class User {
  _id?: string;
  account: string;
  password: string;
  discordId: string;
  name: string;
  avatar: string;
  email: string;
  phoneNumber: string;

  constructor(args: any = {}) {
    this._id = args._id;
    this.account = args.account;
    this.password = args.password;
    this.discordId = args.discordId;
    this.name = args.name;
    this.avatar = args.avatar;
    this.email = args.email;
    this.phoneNumber = args.phoneNumber;
  }
}