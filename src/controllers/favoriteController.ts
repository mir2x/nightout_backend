import { Request, Response, NextFunction } from "express";
import Favorite from "@models/favoriteModel";
import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";

const toggle = async (req: Request, res: Response, next: NextFunction) : Promise<any> => {
  const id = req.params.id;
  const userId = req.user.userId;
  let favorite = await Favorite.findOne({user: userId});
  if(!favorite) {
    favorite = await Favorite.create({bar: id, user: userId});
  }
  if(!favorite.bar.includes(new Types.ObjectId(id))) {
    favorite.bar.push(new Types.ObjectId(id));
  } else {
    favorite.bar = favorite.bar.filter((barId) => barId === new Types.ObjectId(id));
  }
  await favorite.save();
  const message = favorite.bar.includes(new Types.ObjectId(id)) ? "Added to favorites" : "Removed from favorites";
  return res.status(StatusCodes.OK).json({ success: true, message: message, data: {} });
}