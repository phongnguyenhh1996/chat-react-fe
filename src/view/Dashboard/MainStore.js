import { makeAutoObservable } from "mobx";

class MainStore {
  totalPlayers = 2;

  constructor() {
    makeAutoObservable(this, null, { autoBind: true });
  }

  updateTotalPlayers(total) {
    this.totalPlayers = total;
  }
}

export default new MainStore();
