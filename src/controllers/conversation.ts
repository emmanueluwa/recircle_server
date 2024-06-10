import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import ConversationModel from "src/models/conversation";
import UserModel from "src/models/user";
import { sendErrorResponse } from "src/utils/helper";

export const getOrCreateConversation: RequestHandler = async (req, res) => {
  const { peerId } = req.params;

  if (!isValidObjectId(peerId)) {
    return sendErrorResponse(res, "Invalid peer id!", 422);
  }

  const user = await UserModel.findById(peerId);
  if (!user) {
    return sendErrorResponse(res, "User not found!", 404);
  }

  const participants = [req.user.id, peerId];
  //ensure the combination of ids is always in the same order
  const participantsId = participants.sort().join("_");

  const conversation = await ConversationModel.findOneAndUpdate(
    { participantsId },
    //insert for new conversation if upsert does not find participants
    {
      $setOnInsert: {
        participantsId,
        participants,
      },
    },
    { upsert: true, new: true }
  );

  res.json({ conversationId: conversation._id });
};
