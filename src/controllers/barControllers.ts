import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import Bar, { BarSchema } from "@models/barModels";
import createError from "http-errors";
import Cloudinary from "@shared/cloudinary";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, barType, waitTime, crowdMeter, reviews, cover, gallery, about }: BarSchema = req.body;
  const newBar = new Bar({
    name,
    barType,
    waitTime,
    crowdMeter,
    reviews,
    cover,
    gallery,
    about
  });

  const bar = await newBar.save();
  return res.status(StatusCodes.OK).json({success: true, message: "Bar crated successfully.", data: bar});
}

// const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   const { name, barType, waitTime, crowdMeter, reviews, cover, gallery, about } = req.body;
//   const id = req.params.id;
//   const bar = await Bar.findById(id);
//   if(!bar) throw createError(StatusCodes.NOT_FOUND, "Bar not found");
//   if(cover && !bar.cover) {
//     await Cloudinary.remove(bar.cover);
//   }
// }

const getAllBars = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { search } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
      data: {}
    });
  }

  const matchCriteria = search ? {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { placeName: { $regex: search, $options: "i" } }
    ]
  } : {};

  const bars = await Bar.find(matchCriteria).select("name about.address.placeName").limit(limit).skip(skip).lean();
  const total = bars.length;
  const totalPages = Math.ceil(total / limit);

  return res.status(StatusCodes.OK).json({
    success: true, message: "Success", data: {
      bars,
      pagination: { page, limit, total, totalPages }
    }
  });
};

const BarController = {
  getAllBars,
}

export default BarController;