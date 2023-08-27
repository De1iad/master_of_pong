import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getToken } from "../../utils/Utils";
import axios from "axios";
import InteractPopUp from "./PopUpInteract";
import { User, Chat } from "./PropUtils";
import "./PopUp.css";
import ChallengeRoomPopup from "./PopUpChallenge";

axios.defaults.baseURL = process.env.REACT_APP_BACKEND;

interface ChatUsersProps {
  socket: Socket;
}

const ChatUsers: React.FunctionComponent<ChatUsersProps> = ({ socket }) => {
  const [userCurrent, setUserCurrent] = useState<User>();
  const [userCurrentRole, setUserCurrentRole] = useState<string>("");

  const [chat, setChat] = useState<Chat>();
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  const [userOwner, setUserOwner] = useState<User | undefined>();
  const [userME, setUserME] = useState<User | undefined>();
  const [userRegular, setUserRegular] = useState<User[]>([]);
  const [userAdmin, setUserAdmin] = useState<User[]>([]);

  const [mutedAdmins, setMutedAdmins] = useState<boolean[]>([]);
  const [mutedUsers, setMutedUsers] = useState<boolean[]>([]);
  const [mutedMe, setMutedMe] = useState<boolean>();
  const [adminMe, setAdminMe] = useState<boolean>();

  const [blockedAdmins, setBlockedAdmins] = useState<boolean[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<boolean[]>([]);
  const [blockedOwner, setBlockedOwner] = useState<boolean>();

  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  const [interactTarget, setInteractTarget] = useState<User>();
  const [interactTargetRole, setInteractTargetRole] = useState<string>("");

  const [isChallengePopupOpen, setIsChallengePopupOpen] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<string>("");

  useEffect(() => {
    const handleMutedResult = (
      meResult: boolean,
      adminResult: boolean[],
      regularResult: boolean[]
    ) => {
      setMutedMe(meResult);
      setMutedAdmins(adminResult);
      setMutedUsers(regularResult);
    };

    const handleBlockedResult = (
      ownerResult: boolean,
      adminResult: boolean[],
      regularResult: boolean[]
    ) => {
      setBlockedOwner(ownerResult);
      setBlockedAdmins(adminResult);
      setBlockedUsers(regularResult);
    };

    const handleDirectBlockedResult = (result: boolean[]) => {
      setBlockedUsers(result);
    };

    if (userCurrent && userAdmin && userRegular) {
      const adminIDs = userAdmin.map((user) => user.id);
      const regularIDs = userRegular.map((user) => user.id);
      if (userCurrent)
        socket.emit("checkMuted", {
          userID: userCurrent.id,
          adminID: adminIDs,
          regularID: regularIDs,
          chatID: chat?.id,
        });
    }

    if (userOwner && userAdmin && userRegular) {
      const adminIDs = userAdmin.map((user) => user.id);
      const regularIDs = userRegular.map((user) => user.id);
      if (userCurrent)
        socket.emit("checkBlockedUsers", {
          userID: userCurrent.id,
          ownerID: userOwner.id,
          adminID: adminIDs,
          regularID: regularIDs,
          chatID: chat?.id,
        });
    }

    if (userME && userRegular[0] && !userOwner && userAdmin.length === 0) {
      const regularIDs = userRegular.map((user) => user.id);
      socket.emit("checkBlockedDirect", { targetID: regularIDs });
    }

    socket.on("isMutedReturn", handleMutedResult);
    socket.on("isBlockedUsersReturn", handleBlockedResult);
    socket.on("isDirectBlockedReturn", handleDirectBlockedResult);
    return () => {
      socket.off("isMutedReturn", handleMutedResult);
      socket.off("isBlockedUsersReturn", handleBlockedResult);
      socket.off("isDirectBlockedReturn", handleDirectBlockedResult);
    };
  }, [userCurrent, userOwner, userAdmin, userRegular, userME, chat, socket]);

  useEffect(() => {
    const getUserGET = async () => {
      const token = getToken(process.env.REACT_APP_JWT_NAME as string);
      const id = await axios
        .post("api/auth/getUserID", { token })
        .then((res) => res.data);
      const user = await axios.get(`api/users/${id}`);
      return user.data;
    };
    const getUserSET = async () => {
      const tempUser = await getUserGET();
      if (tempUser) setUserCurrent(tempUser);
    };
    getUserSET();
  }, []);

  useEffect(() => {
    if (chat && userCurrent) {
      if (chat.channel === "direct") {
        setUserME(userCurrent);
        const otherUser = users.filter((user) => user.id !== userCurrent.id);
        setUserRegular(otherUser);
        setUserOwner(undefined);
        setUserAdmin([]);
        setUserCurrentRole("Regular");
      } else {
        const owner = chat.creator;
        setUserOwner(owner);
        if (owner.id !== userCurrent.id) {
          setUserME(userCurrent);
          const index = admins.findIndex((user) => user.id === userCurrent.id);
          if (index !== -1) setAdminMe(true);
          else setAdminMe(false);
          setUserCurrentRole("Regular");
        } else {
          setUserME(undefined);
          setUserCurrentRole("Owner");
        }
        const checkADMIN = admins.filter((user) => user.id === userCurrent.id);
        if (checkADMIN && userCurrent.id !== userOwner?.id)
          setUserCurrentRole("Admin");
        const chatPolice = admins.filter(
          (user) => user.id !== userCurrent.id && user.id !== userOwner?.id
        );
        const chatPoliceID = chatPolice.map((admin) => admin.id);
        setUserAdmin(chatPolice);
        const regulars = users.filter(
          (user) =>
            user.id !== userCurrent.id &&
            user.id !== userOwner?.id &&
            !chatPoliceID.includes(user.id)
        );
        setUserRegular(regulars);
      }
    }

    const handleReturnChat = (result: Chat) => {
      if (result) {
        setChat(result);
        setUsers(result.users);
        setAdmins(result.admins);
      }
    };

    const handleReturnChatUsers = (result: Chat) => {
      if (chat && chat.id === result.id) {
        setChat(result);
        setUsers(result.users);
        setAdmins(result.admins);
      }
    };

    const handleStatusRender = () => {
      if (chat && chat.id) socket.emit("getChatRoom", { chatID: chat?.id });
    };

    socket.on("returnChatUsers", handleReturnChat);
    socket.on("returnChatUsersOnly", handleReturnChatUsers);
    socket.on("user connected users", handleStatusRender);
    socket.on("user disconnected users", handleStatusRender);
    return () => {
      socket.off("returnChatUsers", handleReturnChat);
      socket.off("returnChatUsersOnly", handleReturnChatUsers);
      socket.off("user connected users", handleStatusRender);
      socket.off("user disconnected users", handleStatusRender);
    };
  }, [chat, socket, admins, users, userCurrent, userOwner]);

  const togglePopup = () => {
    setInteractTarget(undefined);
    setInteractTargetRole("");
    setIsPopupOpen(!isPopupOpen);
  };

  const interactWithUser = (target: User, targetRole: string) => {
    setInteractTarget(target);
    setInteractTargetRole(targetRole);
    setIsPopupOpen(!isPopupOpen);
  };

  const toggleChallengePopup = () => {
    setIsChallengePopupOpen(!isChallengePopupOpen);
  };

  function handleChallengeTarget(targetID: string) {
    setChallengeTarget(targetID);
    toggleChallengePopup();
  }

  return (
    <>
      <div className="flex flex-col py-8 pl-6 pr-2 rounded-2xl md:w-64 m-1 md:m-0 bg-yellow-50 flex-shrink-0">
        <div className="ml-2 mb-2 font-bold text-2xl">Users</div>
        {userME ? (
          <div className="user-container">
            <span className="italic ml-2 mr-1">{userME.username}</span>
            {userME.status === "online" ? (
              <span>🟢</span>
            ) : userME.status === "offline" ? (
              <span>🔴</span>
            ) : (
              <span>🟢🎮</span>
            )}
            {adminMe ? <div>👮</div> : null}
            {mutedMe ? <div>🔇</div> : null}
          </div>
        ) : null}

        {userOwner ? (
          <div className="user-container">
            <span className="italic ml-2 mr-1">{userOwner.username}</span>
            {userOwner.status === "online" ? (
              <span>🟢</span>
            ) : userOwner.status === "offline" ? (
              <span>🔴</span>
            ) : (
              <span>🟢🎮</span>
            )}
            👑
            {blockedOwner ? <div>⛔</div> : null}
            {userME ? (
              <button
                className="relative text-sm  p-1 ml-3 text-sm bg-gray-50 
				hover:bg-gray-700 hover:text-gray-50 shadow rounded-xl"
                onClick={() => interactWithUser(userOwner, "Owner")}
              >
                interact
              </button>
            ) : null}
          </div>
        ) : null}

        {userAdmin &&
          userAdmin.map((user, index) => (
            <div key={user.id} className="user-container">
              <div>
                <span className="italic ml-2 mr-1">{user.username}</span>
                {user.status === "online" ? (
                  <span>🟢</span>
                ) : user.status === "offline" ? (
                  <span>🔴</span>
                ) : (
                  <span>🟢🎮</span>
                )}
                👮
              </div>
              {mutedAdmins[index] ? <div>🔇</div> : null}
              {blockedAdmins[index] ? <div>⛔</div> : null}
              <button
                className="relative text-sm p-1 ml-3 text-sm bg-gray-50 
				hover:bg-gray-700 hover:text-gray-50 shadow rounded-xl"
                onClick={() => interactWithUser(user, "Admin")}
              >
                interact
              </button>
            </div>
          ))}

        {userRegular &&
          userRegular.map((user, index) => (
            <div key={user.id} className="user-container">
              <span className="italic ml-2 mr-1">{user.username}</span>
              {user.status === "online" ? (
                <span>🟢</span>
              ) : user.status === "offline" ? (
                <span>🔴</span>
              ) : (
                <span>🟢🎮</span>
              )}
              {mutedUsers[index] ? <div>🔇</div> : null}
              {blockedUsers[index] ? <div>⛔</div> : null}
              <button
                className="relative p-1 ml-3 text-sm bg-gray-50 
				hover:bg-gray-700 hover:text-gray-50 shadow rounded-lg"
                onClick={() => interactWithUser(user, "Regular")}
              >
                interact
              </button>
            </div>
          ))}
      </div>

      {isPopupOpen && userCurrent && chat && interactTarget && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <InteractPopUp
            isOpen={isPopupOpen}
            onClose={togglePopup}
            socket={socket}
            chat={chat}
            user={userCurrent}
            userRole={userCurrentRole}
            target={interactTarget}
            targetRole={interactTargetRole}
            onChallenge={handleChallengeTarget}
          />
        </div>
      )}
      {isChallengePopupOpen && userCurrent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <ChallengeRoomPopup
            isOpen={isChallengePopupOpen}
            onClose={toggleChallengePopup}
            userID={userCurrent.id}
            targetID={challengeTarget}
            socket={socket}
          />
        </div>
      )}
    </>
  );
};

export default ChatUsers;
