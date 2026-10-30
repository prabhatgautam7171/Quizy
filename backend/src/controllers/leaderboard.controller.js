
import Attempt from "../models/Attempt.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";


// GET /api/leaderboard/global
export async function getGlobalLeaderboard(req, res, next) {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const results = await Attempt.aggregate([
      // Include finalized attempts.
      {
        $match: {
          status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] },
        },
      },

      // Join quiz information.
      {
        $lookup: {
          from: Quiz.collection.name,
          localField: "quizId",
          foreignField: "_id",
          as: "quiz",
        },
      },
      {
        $unwind: "$quiz",
      },

      // Calculate each student's overall statistics.
      {
        $group: {
          _id: "$studentId",
          totalPoints: {
            $sum: { $ifNull: ["$score", 0] },
          },
          quizzesCompleted: {
            $sum: 1,
          },
          averageScorePercentage: {
            $avg: {
              $cond: [
                { $gt: ["$totalMarks", 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        { $ifNull: ["$score", 0] },
                        "$totalMarks",
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          },
          totalTimeSeconds: {
            $sum: { $ifNull: ["$timeTakenSeconds", 0] },
          },
        },
      },

      // Join student profile information.
      {
        $lookup: {
          from: User.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },

      // Include students only.
      {
        $match: {
          "student.role": "STUDENT",
        },
      },

      // Sort the overall standings.
      {
        $sort: {
          totalPoints: -1,
          averageScorePercentage: -1,
          totalTimeSeconds: 1,
          _id: 1,
        },
      },

      // Assign positions across the full leaderboard.
      {
        $setWindowFields: {
          sortBy: {
            totalPoints: -1,
          },
          output: {
            rank: { $documentNumber: {} },
          },
        },
      },

      // Paginate after ranking.
      {
        $facet: {
          leaderboard: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                rank: 1,
                student: {
                  id: "$student._id",
                  name: "$student.name",
                },
                totalPoints: 1,
                quizzesCompleted: 1,
                averageScorePercentage: {
                  $round: ["$averageScorePercentage", 2],
                },
                totalTimeSeconds: 1,
              },
            },
          ],
          metadata: [
            { $count: "total" },
          ],
        },
      },
    ]);

    const leaderboard = results?.[0]?.leaderboard ?? [];
    const total = results?.[0]?.metadata?.[0]?.total ?? 0;

    console.log("Global leaderboard:", leaderboard);
    console.log("Total students:", total);

    return res.status(200).json({
      success: true,
      leaderboard,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

