import { RequestHandler } from "express";
import { ObjectId, isValidObjectId } from "mongoose";
import ConversationModel from "src/models/conversation";
import UserModel from "src/models/user";
import { sendErrorResponse } from "src/utils/helper";

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
}

interface Chat {
  text: string;
  time: string;
  id: string;
  viewed: boolean;
  user: UserProfile;
}

interface Conversation {
  id: string;
  chats: Chat[];
  peerProfile: { avatar?: string; name: string; id: string };
}

type PopulatedChat = {
  _id: ObjectId;
  content: string;
  timestamp: Date;
  viewed: boolean;
  sentBy: { name: string; _id: ObjectId; avatar?: { url: string } };
};

type PopulatedParticipant = {
  _id: ObjectId;
  name: string;
  avatar?: { url: string };
};

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

export const getConversations: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;

  if (!isValidObjectId(conversationId)) {
    return sendErrorResponse(res, "Invalid conversation id!", 422);
  }

  const conversation = await ConversationModel.findById(conversationId)
    .populate<{ chats: PopulatedChat[] }>({
      path: "chats.sentBy",
      select: "name avatar.url",
    })
    .populate<{ participants: PopulatedParticipant[] }>({
      path: "participants",
      match: { _id: { $ne: req.user.id } }, //return the user that is not logged in
      select: "name avatar.url",
    })
    .select(
      "sentBy chats._id chats.content chats.timestamp chats.viewed participants"
    );

  if (!conversation) return sendErrorResponse(res, "Details not found!", 404);

  const peerProfile = conversation.participants[0];

  const finalConversation: Conversation = {
    id: conversation._id,
    chats: conversation.chats.map((c) => ({
      id: c._id.toString(),
      text: c.content,
      time: c.timestamp.toISOString(),
      viewed: c.viewed,
      user: {
        id: c.sentBy._id.toString(),
        name: c.sentBy.name,
        avatar: c.sentBy.avatar?.url,
      },
    })),
    peerProfile: {
      id: peerProfile._id.toString(),
      name: peerProfile.name,
      avatar: peerProfile.avatar?.url,
    },
  };

  res.json({ conversation: finalConversation });
};
