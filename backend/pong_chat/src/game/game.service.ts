import { Inject, Injectable } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { Map } from './dto/map.dto';
import { Player } from './dto/player.dto';

@Injectable()
export class GameService {
  private ballTimer: NodeJS.Timeout | null = null;
  private botTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly gameGateway: GameGateway,
    @Inject('Map') private readonly map: Map,
    @Inject('Player1') private readonly player1: Player,
    @Inject('Player2') private readonly player2: Player,
  ) {}

  startMovingBall(): void {
    this.map.gameStarted = true;
    // TODO handle taking the player parameters from the frontend
    this.player1.setValues(30, 250, 100, 20, 10);
    this.player2.setValues(770, 250, 100, 20, 1);

    if (this.ballTimer || this.botTimer) return;
    this.ballTimer = setInterval(() => {
      this.moveBall();
    }, 10);

    this.botTimer = setInterval(() => {
      this.moveBot();
    }, 1);
  }

  stopMovingBall(): void {
    this.map.stopGame();
    this.player1.resetPos(this.map.Height);
    this.player2.resetPos(this.map.Height);

    if (this.ballTimer) {
      clearInterval(this.ballTimer);
      this.ballTimer = null;
    }
    if (this.botTimer) {
      clearInterval(this.botTimer);
      this.botTimer = null;
    }
    this.gameGateway.server.emit('gameUpdate', {
      paddle: this.player1.pos.y,
      bot: this.player2.pos.y,
      ball: this.map.ballPos,
    });
  }

  moveUp(): void {
    if (this.map.gameStarted == false) return;

    this.player1.pos.y -= this.player1.speed;
    if (this.player1.pos.y < 0) this.player1.pos.y = 0;
    this.gameGateway.server.emit('gameUpdate', {
      paddle: this.player1.pos.y,
      bot: this.player2.pos.y,
      ball: this.map.ballPos,
    });
  }

  moveDown(): void {
    //if (this.map.gameStarted == false) return;

    this.player1.pos.y += this.player1.speed;
    if (this.player1.pos.y > this.map.Height - this.player1.height)
      this.player1.pos.y = this.map.Height - this.player1.height;
    this.gameGateway.server.emit('gameUpdate', {
      paddle: this.player1.pos.y,
      bot: this.player2.pos.y,
      ball: this.map.ballPos,
    });
  }

  private moveBot(): void {
    //if (this.map.gameStarted == false) return;

    if (this.map.ballPos.y > this.player2.pos.y + this.player2.height / 2)
      this.player2.pos.y += this.player2.speed;
    if (this.map.ballPos.y < this.player2.pos.y + this.player2.height / 2)
      this.player2.pos.y -= this.player2.speed;

    if (this.player2.pos.y < 0) this.player2.pos.y = 0;
    if (this.player2.pos.y > this.map.Height - this.player2.height)
      this.player2.pos.y = this.player2.height;
    this.gameGateway.server.emit('gameUpdate', {
      paddle: this.player1.pos.y,
      bot: this.player2.pos.y,
      ball: this.map.ballPos,
    });
  }

  private moveBall(): void {
    if (this.map.gameStarted == false) return;

    this.map.ballPos.x += this.map.ballVel.x;
    this.map.ballPos.y += this.map.ballVel.y;

    // Ball interaction with walls
    if (this.map.ballPos.x >= this.map.Width || this.map.ballPos.x <= 0) {
      this.map.ballPos.x = this.map.Width / 2;
      this.map.ballPos.y = this.map.Height / 2;
      this.map.ballVel.x = this.map.ballVel.x * -1;
    }

    if (this.map.ballPos.y >= this.map.Height || this.map.ballPos.y <= 0) {
      this.map.ballVel.y = this.map.ballVel.y * -1;
    }

    // Ball interaction with paddles

    // interaction with player 1
    if (
      this.map.ballPos.x <= this.player1.pos.x + this.player1.width &&
      this.map.ballPos.y >= this.player1.pos.y &&
      this.map.ballPos.y <= this.player1.pos.y + this.player1.height
    ) {
      this.map.ballVel.x = this.map.ballVel.x * -1;
      this.map.ballPos.x = this.player1.pos.x + this.player1.width;
    }

    // interaction with player 2
    if (
      this.map.ballPos.x >= this.player2.pos.x &&
      this.map.ballPos.y >= this.player2.pos.y &&
      this.map.ballPos.y <= this.player2.pos.y + this.player2.height
    ) {
      this.map.ballVel.x = this.map.ballVel.x * -1;
      this.map.ballPos.x = this.player2.pos.x - this.player2.width - 1;
    }

    this.gameGateway.server.emit('gameUpdate', {
      paddle: this.player1.pos.y,
      bot: this.player2.pos.y,
      ball: this.map.ballPos,
    });
  }
}
