'use client'
import React, { useEffect, useState, useRef, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { db } from "../../libs/firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import axios from "axios";
import { CiSearch } from "react-icons/ci";
import { IoMdDoneAll } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import { IoSettings } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";

interface Message {
    id: string;
    text: string;
    userName: string;
    userIcon: string;
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
}

interface Character {
    mal_id: number;
    name: string;
    images: {
        jpg: {
            image_url: string;
        };
    };
}

const ChatBox: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [userName, setUserName] = useState<string | null>(null);
    const [userIcon, setUserIcon] = useState<string | null>(null);
    const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<Character[]>([]);
    const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
    const [isTypeNameModalOpen, setIsTypeNameModalOpen] = useState<boolean>(false);
    const router = useRouter();

    // Ref for the messages container
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedName = localStorage.getItem("userName");
        const storedIcon = localStorage.getItem("userIcon");
        if (!storedName || !storedIcon) {
            setIsNameModalOpen(true);
        } else {
            setUserName(storedName);
            setUserIcon(storedIcon);
        }

        const q = query(collection(db, "messages"), orderBy("timestamp"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData: Message[] = [];
            snapshot.forEach((doc) => {
                messagesData.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the messages container whenever messages change
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (newMessage.trim() && userName && userIcon) {
            await addDoc(collection(db, "messages"), {
                text: newMessage,
                userName: userName,
                userIcon: userIcon,
                timestamp: serverTimestamp(),
            });
            setNewMessage("");
        }
    };

    const handleNameSubmit = () => {
        if (userName && userIcon && searchResults.length > 0 && searchQuery !== '' && selectedCharacterId !== null) {
            localStorage.setItem("userName", userName);
            localStorage.setItem("userIcon", userIcon);
            setIsNameModalOpen(false);
            setSearchResults([]);
            setSearchQuery('');
            setSelectedCharacterId(null);
        }
    };

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            try {
                const response = await axios.get(`https://api.jikan.moe/v4/characters`, {
                    params: {
                        q: searchQuery,
                        limit: 10,
                    },
                });
                setSearchResults(response.data.data);
            } catch (error) {
                console.error("Error fetching character data:", error);
            }
        }
    };

    const selectCharacter = (character: Character) => {
        setUserIcon(character.images.jpg.image_url);
        setUserName(character.name);
        setSearchQuery(character.name);
        setSelectedCharacterId(character.mal_id); // Update the selected character ID
    };

    const handleChangeCharacter = () => {
        setIsNameModalOpen(true);
        setIsTypeNameModalOpen(true);
    }

    return (
        <div className="flex flex-col h-screen bg-[#111111] py-12">
            <div className="fixed top-0 left-0 p-4 bg-[#222222] w-screen">
                <div className="flex text-white font-bold items-center">
                    <p>Phòng Chat Anime</p>
                </div>
            </div>
            {isNameModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-[#333333] text-white rounded shadow">
                        {isTypeNameModalOpen &&
                            <div className="flex justify-end"><IoMdClose className="mt-3 mx-3 text-white text-2xl cursor-pointer"
                                onClick={() => {
                                    setIsNameModalOpen(false);
                                    setSearchResults([]);
                                    setSearchQuery('');
                                    setSelectedCharacterId(null);
                                }}
                            /></div>
                        }
                        <div className={`px-6 pb-6 ${isTypeNameModalOpen ? "pt-4" : "pt-6"}`}>
                            <h2 className="text-lg font-bold mb-4">Vui lòng chọn 1 nhân vật Anime!</h2>
                            <form onSubmit={handleSearch} className="flex mb-4">
                                <input
                                    type="text"
                                    className="flex-1 p-2 outline-none border rounded bg-[#333333]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Vui lòng nhập tên..."
                                />
                                <button
                                    type="submit"
                                    className="ml-2 text-3xl text-white"
                                >
                                    <CiSearch />
                                </button>
                            </form>
                            <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto">
                                {searchResults.map((character) => (
                                    <div
                                        key={character.mal_id}
                                        className={`flex items-center p-2 border rounded cursor-pointer ${character.mal_id === selectedCharacterId ? 'border-blue-500' : ''
                                            }`}
                                        onClick={() => selectCharacter(character)}
                                    >
                                        <div className="image-container mr-2">
                                            <Image
                                                src={character.images.jpg.image_url}
                                                alt={character.name}
                                                width={225}  // Chiều rộng cố định của ảnh
                                                height={350} // Chiều cao cố định của ảnh
                                                quality={100}
                                            />
                                        </div>
                                        <p>{character.name}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleNameSubmit}
                                className="mt-4 text-white text-2xl"
                            >
                                <IoMdDoneAll />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message) => (
                    <div key={message.id} className="flex my-4">
                        <div className="image-container mr-2">
                            <Image
                                src={message.userIcon}
                                alt={message.userName}
                                width={225}  // Chiều rộng cố định của ảnh
                                height={350} // Chiều cao cố định của ảnh
                                quality={100}
                                className="flex-shrink-0" // Flex-shrink-0 để ngăn không cho ảnh co lại
                            />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[#666666]">{message.userName}</p>
                            <div className="my-2 p-3 bg-[#2c2c2c] rounded-lg text-white flex items-center">
                                <p>{message.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {/* This div is used as a reference point to scroll to */}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex items-center p-4 bg-[#222222]">
                <IoSettings
                    className="mr-2 text-white text-2xl cursor-pointer"
                    onClick={handleChangeCharacter}
                />
                <input
                    type="text"
                    className="flex-1 p-2 outline-none text-white rounded bg-[#222222]"
                    value={newMessage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewMessage(e.target.value)
                    }
                    placeholder="Nhập tin nhắn..."
                />
                {newMessage ?
                    (
                        <button
                            onClick={handleSend}
                            className="ml-2 text-white text-2xl cursor-pointer"
                        >
                            <IoSend />
                        </button>
                    ) : (
                        <IoChatbubbleEllipsesSharp
                            onClick={() => {
                                router.push("/chat");
                                window.sessionStorage.setItem('reload', 'true');
                            }}
                            className="ml-2 text-white text-2xl cursor-pointer"
                        />
                    )
                }
            </div>
        </div>
    );
};

export default ChatBox;
