//@ts-nocheck
class Room {
    constructor(id) {
      this.id = id;
      this.users = [];
      this.readyUsers = new Set();
      this.gameInProgress = false;
      this.currentWord = '';
      this.currentDrawer = '';
      this.scores = {};
      this.status = 'waiting'; // New property
    }
  
    addUser(userName) {
      this.users.push(userName);
      this.scores[userName] = 0;
    }
  
    setUserReady(userName) {
      this.readyUsers.add(userName);
    }
  
    allUsersReady() {
      return this.readyUsers.size === this.users.length;
    }
  
    setStatus(status) {
      this.status = status;
    }
  
    startGame(io) {
      this.gameInProgress = true;
      this.status = 'in-game';
      // Implement game start logic
    }
  
    updateScore(userName, points) {
      this.scores[userName] += points;
    }
  
    endRound(io) {
      // Implement round end logic
    }
  
    toJSON() {
      return {
        id: this.id,
        users: this.users,
        readyUsers: Array.from(this.readyUsers),
        gameInProgress: this.gameInProgress,
        currentWord: this.currentWord,
        currentDrawer: this.currentDrawer,
        scores: this.scores,
        status: this.status
      };
    }
  }

  