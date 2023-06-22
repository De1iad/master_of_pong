import { Injectable } from '@nestjs/common';
import { Options } from '../movement.dto';
import { runInThisContext } from 'vm';

@Injectable()
export class Player {
  public id: string;
  public pos: { x: number; y: number };
  public character: HTMLImageElement;
  public height: number;
  public width: number;
  public speed: number;
  public getOverHere: boolean;
  public freeze: boolean;
  public hasAbility: boolean;
  public ability: number;
  public hasSpecial: boolean;
  public options: Options;

  constructor() {
    this.pos = { x: 10, y: 250 };
    this.height = 100;
    this.width = 20;
    this.speed = 10;
    this.getOverHere = false;
    this.freeze = false;
    this.hasAbility = true;
    this.hasSpecial = true;
    this.ability = Math.floor(Math.random() * 5);
  }

  public setValues(
    x: number,
    y: number,
    height: number,
    width: number,
    speed: number,
    options: Options,
  ): void {
    this.pos.x = x;
    this.pos.y = y;
    this.height = height;
    this.width = width;
    this.speed = speed;
    this.options = options;
  }

  public resetPos(height: number) {
    this.pos.y = (height - this.height) / 2;
  }
}
