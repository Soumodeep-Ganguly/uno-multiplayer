import { unoDB } from "../config/db";
import GameStateModelFactory from "../models/game_state";
import UserModelFactory from "../models/user";
import GameHistoryModelFactory from "../models/game_history";

// Initialize models using the connection — factory pattern like universal-backend
export const GameStateModel = GameStateModelFactory(unoDB);
export const UserModel = UserModelFactory(unoDB);
export const GameHistoryModel = GameHistoryModelFactory(unoDB);
