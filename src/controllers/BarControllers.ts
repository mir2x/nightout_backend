import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import Bar from "@models/barModels";


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