import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import axios from "axios";
import { getToken } from "../../utils/Utils";
import PopUpCreateChat from "./PopUpCreateChat";
import PopUpJoinChat from "./PopUpJoinChat";
import { Message, User, Chat } from "./PropUtils";

axios.defaults.baseURL = "http://localhost:5000/";

interface ChatBarProps {
  socket: Socket;
}

const ChatBar: React.FunctionComponent<ChatBarProps> = ({ socket }) => {
  const [directChats, setDirectChats] = useState<User[]>([]);
  const [userID, setUserID] = useState<string | undefined>(undefined);
  const [chatRooms, setChatRooms] = useState<Chat[]>();

  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [isJoinPopupOpen, setIsJoinPopupOpen] = useState(false);

  useEffect(() => {
    const token = getToken("jwtToken");
  
    const handleReturnChatBar = (data: {users: User[], chatRooms: Chat[]}) => {
      if (data.users)
        setDirectChats(data.users);
      if (data.chatRooms)
        setChatRooms(data.chatRooms);
      console.log("Rooms : ", data.chatRooms);
    };

    const handleStatusRender = () => {
      socket.emit("getChatBar", {userID: userID});
    };

    const handleRenderChatBar = () => {
      socket.emit("getChatBar", {userID: userID});
    };

    async function getUserID() {
      const id = await axios.post("api/auth/getUserID", { token });
      setUserID(id.data);
    }
  
    if (!userID)
      getUserID();
    socket.emit("getChatBar", {userID: userID});

    socket.on("returnChatBar", handleReturnChatBar);
    socket.on("renderChatBar", handleRenderChatBar);
    socket.on("user connected bar", handleStatusRender);
    socket.on("user disconnected bar", handleStatusRender);
    return () => {
      socket.off("returnChatBar", handleReturnChatBar);
      socket.off("renderChatBar", handleRenderChatBar);
      socket.off("user connected bar", handleStatusRender);
      socket.off("user disconnected bar", handleStatusRender);
    };
  }, [socket, userID])

  function handleGetDirectChat(user: User) {
    socket.emit("getDirectChat", { user1ID: userID, user2ID: user.id });
  }

  function handleGetChatRoom(chatID: number) {
    socket.emit("getChatRoom", { chatID: chatID });
  }

  function createChatRoom(chatRoomName: string, chatRoomPassword: string) {
    socket.emit("createChatRoom", { title: chatRoomName, password: chatRoomPassword });
  }

  function joinChatRoom(chatRoomName: string, chatRoomPassword: string) {
    socket.emit("joinChatRoom", { title: chatRoomName, password: chatRoomPassword });
  }

  const toggleCreatePopup = () => {
    setIsCreatePopupOpen(!isCreatePopupOpen);
  };

  const toggleJoinPopup = () => {
    setIsJoinPopupOpen(!isJoinPopupOpen);
  };

  return (
	<div className="flex flex-col py-8 pl-6 pr-2 rounded-2xl w-64 bg-gray-200 flex-shrink-0">
		<div className="flex flex-row items-center justify-start h-10 w-full">
	  		<div className="flex items-center justify-center rounded-2xl text-white bg-gray-800 h-8 w-8">
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
					d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
				</svg>
	  		</div>
	  	<div className="ml-2 font-bold text-2xl">Chat</div>
	</div>
  
	<div className="flex flex-col mt-8 flex-1">
		<div className="flex flex-row items-center justify-between text-xs">
			<span className="font-bold">Friends</span>
	  	</div>
		{directChats.map((user) => (
			<div key={user.username} className="flex flex-col space-y-1 mt-4 overflow-y-auto">
			{user.isFriend ? (
			   <button onClick={() => handleGetDirectChat(user)}
			   className="flex flex-row items-center hover:bg-gray-100 rounded-xl p-2">
				 <div className="ml-2 text-sm font-semibold">{user.username} {user.status} </div>
			   </button>
			   ) : null}
			</div>
		))}
	</div>

	<div className="flex flex-col mt-2 flex-1">
		<div className="flex flex-row items-center justify-between text-xs">
			<span className="font-bold">Chat Rooms</span>
		</div>
		<div className="flex flex-col space-y-1 mt-2 overflow-y-auto">
			<ul>
			{chatRooms && chatRooms.map((chat) => (
      			<div key={chat.id} className="flex justify-between items-center">
			  		<button onClick={() => handleGetChatRoom(chat.id)}>
						{chat.title}
			  		</button>
		  		</div>
			))}
	  		</ul>
			  <div className="flex md:flex-row">
    	    	<button  onClick={() => toggleCreatePopup()} className="relative mr-3 text-sm bg-green-600 text-gray-50 hover:bg-green-800 py-2 px-4 shadow rounded-xl flex-1">
    	    	  	create
    	    	</button>
    	    	<button onClick={() => toggleJoinPopup()} className="relative mr-3 text-sm bg-green-600 text-gray-50 hover:bg-green-800 py-2 px-4 shadow rounded-xl flex-1">
    	      		join
    	    	</button>
    	  	</div>
	  	</div>
	</div>
	
	{isCreatePopupOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <PopUpCreateChat isOpen={isCreatePopupOpen} onClose={toggleCreatePopup} onCreateChatRoom={createChatRoom} socket={socket} />
        </div>
      )}
  {isJoinPopupOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <PopUpJoinChat isOpen={isJoinPopupOpen} onClose={toggleJoinPopup} onJoinChatRoom={joinChatRoom} socket={socket} />
        </div>
      )}
</div>
    
  );
};

export default ChatBar;
