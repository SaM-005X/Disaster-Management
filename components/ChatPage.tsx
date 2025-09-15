import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, ChatRoom, ChatMessage, ChatInvitation, GlobalNotice } from '../types';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import { SendIcon } from './icons/SendIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { UsersIcon } from './icons/UsersIcon';
import { XIcon } from './icons/XIcon';
import { LockIcon } from './icons/LockIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { UploadIcon } from './icons/UploadIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

// Props for the main ChatPage component
interface ChatPageProps {
    currentUser: User;
    allUsers: User[];
    chatRooms: ChatRoom[];
    chatMessages: ChatMessage[];
    chatInvitations: ChatInvitation[];
    onCreateRoom: (newRoom: Omit<ChatRoom, 'id'>) => void;
    onSendMessage: (roomId: string, text: string) => void;
    onSendInvitations: (roomId: string, roomName: string, inviteeIds: string[]) => void;
    onAcceptInvitation: (invitationId: string) => void;
    onDeclineInvitation: (invitationId: string) => void;
    onUpdateRoom: (updatedRoom: ChatRoom) => void;
    onDeleteRoom: (roomId: string) => void;
    globalNotices: GlobalNotice[];
    onPostNotice: (text: string, imageUrl?: string) => void;
}

// A single message bubble component
const MessageBubble: React.FC<{ message: ChatMessage; isOwnMessage: boolean; currentlySpokenId: string | null; }> = ({ message, isOwnMessage, currentlySpokenId }) => {
    const alignment = isOwnMessage ? 'items-end' : 'items-start';
    const bubbleColor = isOwnMessage ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    const borderRadius = isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none';

    return (
        <div className={`flex flex-col ${alignment}`}>
            <div className="flex items-end gap-2 max-w-lg">
                {!isOwnMessage && <img src={message.senderAvatarUrl} alt={message.senderName} className="h-8 w-8 rounded-full flex-shrink-0" />}
                <div className={`p-3 rounded-xl ${bubbleColor} ${borderRadius}`}>
                    {!isOwnMessage && <p className={`text-xs font-bold mb-1 ${currentlySpokenId === `msg-sender-${message.id}` ? 'tts-highlight' : ''}`}>{message.senderName}</p>}
                    <p className={`text-sm ${currentlySpokenId === `msg-text-${message.id}` ? 'tts-highlight' : ''}`}>{message.text}</p>
                </div>
            </div>
            <p className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'mr-2' : 'ml-10'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
    );
};

// Main Chat Page Component
const ChatPage: React.FC<ChatPageProps> = (props) => {
    const { currentUser, allUsers, chatRooms, chatMessages, onCreateRoom, onSendMessage, chatInvitations, onSendInvitations, onAcceptInvitation, onDeclineInvitation, onUpdateRoom, onDeleteRoom, globalNotices, onPostNotice } = props;
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    const [selectedRoomId, setSelectedRoomId] = useState<string>('global-chat');
    const [messageInput, setMessageInput] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [managingRoom, setManagingRoom] = useState<ChatRoom | null>(null);
    const [invitingToRoom, setInvitingToRoom] = useState<ChatRoom | null>(null);
    const [deletingRoom, setDeletingRoom] = useState<ChatRoom | null>(null);
    const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);
    const [isNoticeBannerVisible, setIsNoticeBannerVisible] = useState(true);
    const [isChatVisibleOnMobile, setIsChatVisibleOnMobile] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const latestNotice = useMemo(() => globalNotices?.[0] || null, [globalNotices]);

    const canCreatePrivateChat = currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.GOVERNMENT_OFFICIAL;

    const myPrivateRooms = useMemo(() =>
        chatRooms.filter(room => room.type === 'private' && room.memberIds.includes(currentUser.id)),
        [chatRooms, currentUser.id]
    );
    
    const pendingInvitations = useMemo(() =>
        chatInvitations.filter(inv => inv.inviteeId === currentUser.id && inv.status === 'pending'),
        [chatInvitations, currentUser.id]
    );

    const messagesForSelectedRoom = useMemo(() =>
        chatMessages.filter(msg => msg.chatRoomId === selectedRoomId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        [chatMessages, selectedRoomId]
    );
    
    const selectedRoom = useMemo(() => chatRooms.find(r => r.id === selectedRoomId), [chatRooms, selectedRoomId]);

    useEffect(() => {
        if (latestNotice) {
            const dismissed = sessionStorage.getItem(`noticeDismissed-${latestNotice.id}`);
            if (dismissed === 'true') {
                setIsNoticeBannerVisible(false);
            } else {
                setIsNoticeBannerVisible(true);
            }
        }
    }, [latestNotice]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messagesForSelectedRoom]);
    
    // Auto-select global chat if the selected private chat disappears (e.g., deleted or removed)
    useEffect(() => {
        if (selectedRoomId !== 'global-chat' && !chatRooms.some(r => r.id === selectedRoomId)) {
            setSelectedRoomId('global-chat');
        }
    }, [chatRooms, selectedRoomId]);
    
    useEffect(() => {
        const textsToRead: TTSText[] = [];
        
        textsToRead.push({ id: 'chat-page-title', text: translate('Chats') });

        if (pendingInvitations.length > 0) {
            textsToRead.push({ id: 'pending-invitations-header', text: translate('Pending Invitations') });
            pendingInvitations.forEach(inv => {
                textsToRead.push({ id: `invitation-${inv.id}-text`, text: `${inv.inviterName} ${translate('invited you to join')} ${inv.roomName}.` });
            });
        }

        textsToRead.push({ id: 'global-chat-header', text: translate('Global Chat') });
        textsToRead.push({ id: 'global-chat-list-name', text: translate('Global Chat') });
        textsToRead.push({ id: 'global-chat-list-desc', text: translate('Chat with all users') });
        
        if (canCreatePrivateChat && myPrivateRooms.length > 0) {
            textsToRead.push({ id: 'private-chats-header', text: translate('Private Chats') });
            myPrivateRooms.forEach(room => {
                textsToRead.push({ id: `private-chat-list-name-${room.id}`, text: translate(room.name) });
            });
        }

        if (selectedRoom) {
            textsToRead.push({ id: `active-chat-header-${selectedRoom.id}`, text: translate(selectedRoom.name) });
            
            if (selectedRoom.id === 'global-chat' && latestNotice) {
                if (isNoticeBannerVisible) {
                    textsToRead.push({ id: `notice-banner-title-${latestNotice.id}`, text: `${translate('Official Notice')} from ${latestNotice.postedByName}` });
                    textsToRead.push({ id: `notice-banner-text-${latestNotice.id}`, text: latestNotice.text });
                } else {
                    textsToRead.push({ id: `pinned-notice-bar-${latestNotice.id}`, text: `${translate('Pinned Notice')}: ${latestNotice.text}` });
                }
            }

            messagesForSelectedRoom.forEach(msg => {
                if (msg.senderId !== currentUser.id) {
                    textsToRead.push({ id: `msg-sender-${msg.id}`, text: msg.senderName });
                }
                textsToRead.push({ id: `msg-text-${msg.id}`, text: msg.text });
            });
        } else {
            textsToRead.push({ id: 'no-chat-selected-text', text: translate('Select a chat to start messaging') });
        }

        registerTexts(textsToRead);
    }, [
        currentUser.id, canCreatePrivateChat, isNoticeBannerVisible, latestNotice,
        messagesForSelectedRoom, myPrivateRooms, pendingInvitations, registerTexts,
        selectedRoom, translate
    ]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedRoomId) return;
        onSendMessage(selectedRoomId, messageInput);
        setMessageInput('');
    };

    const handleDismissNotice = () => {
        if (latestNotice) {
            sessionStorage.setItem(`noticeDismissed-${latestNotice.id}`, 'true');
            setIsNoticeBannerVisible(false);
        }
    };
    
    const handleSelectRoom = (roomId: string) => {
        setSelectedRoomId(roomId);
        setIsChatVisibleOnMobile(true);
    };

    return (
        <>
            <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                {/* Chat List Sidebar */}
                <aside className={`w-full md:w-1/3 xl:w-1/4 border-r border-gray-200 dark:border-gray-700 flex-col ${isChatVisibleOnMobile ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h1 className={`text-2xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'chat-page-title' ? 'tts-highlight' : ''}`}>{translate('Chats')}</h1>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {pendingInvitations.length > 0 && <PendingInvitations invitations={pendingInvitations} onAccept={onAcceptInvitation} onDecline={onDeclineInvitation} currentlySpokenId={currentlySpokenId} />}
                        {/* Global Chat */}
                        <div className="p-2">
                            <h2 className={`px-2 py-1 text-xs font-bold text-gray-500 uppercase ${currentlySpokenId === 'global-chat-header' ? 'tts-highlight' : ''}`}>{translate('Global Chat')}</h2>
                            <button onClick={() => handleSelectRoom('global-chat')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedRoomId === 'global-chat' ? 'bg-teal-50 dark:bg-teal-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center"><UsersIcon className="h-5 w-5"/></div>
                                <div>
                                    <p className={`font-semibold text-gray-900 dark:text-white ${currentlySpokenId === 'global-chat-list-name' ? 'tts-highlight' : ''}`}>{translate('Global Chat')}</p>
                                    <p className={`text-sm text-gray-500 dark:text-gray-400 ${currentlySpokenId === 'global-chat-list-desc' ? 'tts-highlight' : ''}`}>{translate('Chat with all users')}</p>
                                </div>
                            </button>
                        </div>

                        {/* Private Chats */}
                        {canCreatePrivateChat && (
                            <div className="p-2">
                                <div className="flex justify-between items-center px-2 py-1">
                                    <h2 className={`text-xs font-bold text-gray-500 uppercase ${currentlySpokenId === 'private-chats-header' ? 'tts-highlight' : ''}`}>{translate('Private Chats')}</h2>
                                    <button onClick={() => setIsCreateModalOpen(true)} className="p-1 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-full">
                                        <PlusCircleIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                {myPrivateRooms.map(room => (
                                    <div key={room.id} className="relative group">
                                        <button onClick={() => handleSelectRoom(room.id)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedRoomId === room.id ? 'bg-teal-50 dark:bg-teal-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center"><LockIcon className="h-5 w-5"/></div>
                                            <div className="overflow-hidden">
                                                <p className={`font-semibold text-gray-900 dark:text-white truncate ${currentlySpokenId === `private-chat-list-name-${room.id}` ? 'tts-highlight' : ''}`}>{translate(room.name)}</p>
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Chat View */}
                <main className={`flex-1 flex-col ${isChatVisibleOnMobile ? 'flex' : 'hidden md:flex'}`}>
                    {selectedRoom ? (
                        <>
                            <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsChatVisibleOnMobile(false)} className="md:hidden p-2 rounded-full -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ArrowLeftIcon className="h-6 w-6" />
                                    </button>
                                    <h2 className={`text-xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === `active-chat-header-${selectedRoom.id}` ? 'tts-highlight' : ''}`}>{translate(selectedRoom.name)}</h2>
                                </div>
                                {selectedRoom.id === 'global-chat' && currentUser.role === UserRole.GOVERNMENT_OFFICIAL && (
                                    <button onClick={() => setIsCreateNoticeModalOpen(true)} className="flex items-center gap-2 text-sm font-bold bg-amber-500 text-white py-1.5 px-3 rounded-full hover:bg-amber-600">
                                        <MegaphoneIcon className="h-5 w-5" />
                                        {translate('Post Notice')}
                                    </button>
                                )}
                                {selectedRoom.type === 'private' && selectedRoom.ownerId === currentUser.id && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setInvitingToRoom(selectedRoom); setIsInviteModalOpen(true); }} className="flex items-center gap-2 text-sm font-bold bg-teal-600 text-white py-1.5 px-3 rounded-full hover:bg-teal-700">
                                            <UserPlusIcon className="h-5 w-5" />
                                            {translate('Invite')}
                                        </button>
                                        <button onClick={() => setManagingRoom(selectedRoom)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                            <SettingsIcon className="h-5 w-5"/>
                                        </button>
                                    </div>
                                )}
                            </header>
                            {selectedRoom.id === 'global-chat' && latestNotice && (
                                isNoticeBannerVisible
                                ? <NoticeBanner notice={latestNotice} onDismiss={handleDismissNotice} currentlySpokenId={currentlySpokenId} />
                                : <PinnedNoticeBar notice={latestNotice} onExpand={() => setIsNoticeBannerVisible(true)} currentlySpokenId={currentlySpokenId} />
                            )}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {messagesForSelectedRoom.map(msg => <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.senderId === currentUser.id} currentlySpokenId={currentlySpokenId} />)}
                                <div ref={messagesEndRef} />
                            </div>
                            <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder={translate('Type your message...')}
                                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800 dark:text-gray-100"
                                    />
                                    <button type="submit" className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-gray-400">
                                        <SendIcon className="h-5 w-5"/>
                                    </button>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className="m-auto text-center text-gray-500">
                            <MessageSquareIcon className="h-16 w-16 mx-auto"/>
                            <p className={`mt-2 font-semibold ${currentlySpokenId === 'no-chat-selected-text' ? 'tts-highlight' : ''}`}>{translate('Select a chat to start messaging')}</p>
                        </div>
                    )}
                </main>

                {/* Modals */}
                {isCreateModalOpen && <CreateChatModal onClose={() => setIsCreateModalOpen(false)} onCreate={onCreateRoom} currentUser={currentUser} />}
                {isInviteModalOpen && invitingToRoom && <InviteModal onClose={() => setIsInviteModalOpen(false)} room={invitingToRoom} {...props} />}
                {managingRoom && <ChatSettingsModal onClose={() => setManagingRoom(null)} room={managingRoom} {...props} onDeleteRequest={() => { setDeletingRoom(managingRoom); setManagingRoom(null); }} />}
                {deletingRoom && <DeleteConfirmationModal room={deletingRoom} onClose={() => setDeletingRoom(null)} onDelete={() => { onDeleteRoom(deletingRoom.id); setDeletingRoom(null); }} />}
                {isCreateNoticeModalOpen && <CreateNoticeModal onClose={() => setIsCreateNoticeModalOpen(false)} onPost={onPostNotice} />}
            </div>
            <style>{`
                .input-style { 
                    @apply px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200; 
                }
            `}</style>
        </>
    );
};

const PendingInvitations: React.FC<{invitations: ChatInvitation[]; onAccept: (id: string) => void; onDecline: (id: string) => void; currentlySpokenId: string | null;}> = ({ invitations, onAccept, onDecline, currentlySpokenId }) => {
    const { translate } = useTranslate();
    return (
        <div className="p-2">
            <h2 className={`px-2 py-1 text-xs font-bold text-gray-500 uppercase ${currentlySpokenId === 'pending-invitations-header' ? 'tts-highlight' : ''}`}>{translate('Pending Invitations')}</h2>
            {invitations.map(inv => (
                <div key={inv.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/50">
                    <p className={`text-sm text-amber-800 dark:text-amber-200 ${currentlySpokenId === `invitation-${inv.id}-text` ? 'tts-highlight' : ''}`}>
                        <span className="font-bold">{inv.inviterName}</span> {translate('invited you to join')} <span className="font-bold">{inv.roomName}</span>.
                    </p>
                    <div className="mt-2 flex gap-2">
                        <button onClick={() => onAccept(inv.id)} className="flex-1 text-xs font-bold py-1 px-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600">{translate('Accept')}</button>
                        <button onClick={() => onDecline(inv.id)} className="flex-1 text-xs font-bold py-1 px-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200">{translate('Decline')}</button>
                    </div>
                </div>
            ))}
        </div>
    );
};


// Create Chat Modal
const CreateChatModal: React.FC<{onClose: () => void; onCreate: ChatPageProps['onCreateRoom']; currentUser: User;}> = ({ onClose, onCreate, currentUser }) => {
    const { translate } = useTranslate();
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate({
            name: name.trim(),
            type: 'private',
            ownerId: currentUser.id,
            memberIds: [currentUser.id],
            allowedRoles: [currentUser.role],
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{translate('Create Private Chat')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={translate('Chat Name')} required className="w-full input-style" />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">{translate('Cancel')}</button>
                        <button type="submit" className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors">{translate('Create')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Invite Members Modal
const InviteModal: React.FC<{onClose: () => void; room: ChatRoom; allUsers: User[]; onSendInvitations: ChatPageProps['onSendInvitations'];}> = ({ onClose, room, allUsers, onSendInvitations }) => {
    const { translate } = useTranslate();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const inviteableUsers = useMemo(() => allUsers.filter(user => 
        user.role === room.allowedRoles?.[0] && !room.memberIds.includes(user.id)
    ), [allUsers, room]);
    
    const handleToggleUser = (userId: string) => {
        setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleInvite = () => {
        if (selectedUserIds.length === 0) return;
        onSendInvitations(room.id, room.name, selectedUserIds);
        onClose();
    };
    
    const inviteButtonText = useMemo(() => {
        if (inviteableUsers.length === 0) return translate('No users to invite');
        if (selectedUserIds.length === 0) return translate('Select users to invite');
        return translate('Send Invites');
    }, [inviteableUsers.length, selectedUserIds.length, translate]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{translate('Invite to')} "{room.name}"</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><XIcon className="h-5 w-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {inviteableUsers.length > 0 ? inviteableUsers.map(user => (
                        <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => handleToggleUser(user.id)} className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500" />
                            <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</span>
                        </label>
                    )) : <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">{translate('No other users to invite.')}</p>}
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">{translate('Cancel')}</button>
                    <button onClick={handleInvite} disabled={inviteableUsers.length === 0 || selectedUserIds.length === 0} className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {inviteButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};


// Chat Settings Modal (formerly ManageMembersModal)
const ChatSettingsModal: React.FC<{onClose: () => void; room: ChatRoom; allUsers: User[]; onUpdateRoom: ChatPageProps['onUpdateRoom']; onDeleteRequest: () => void;}> = ({ onClose, room, allUsers, onUpdateRoom, onDeleteRequest }) => {
    const { translate } = useTranslate();
    const [roomName, setRoomName] = useState(room.name);
    
    const currentMembers = useMemo(() => allUsers.filter(u => room.memberIds.includes(u.id)), [allUsers, room.memberIds]);
    
    const handleRemoveMember = (memberId: string) => {
        const updatedRoom = {...room, memberIds: room.memberIds.filter(id => id !== memberId)};
        onUpdateRoom(updatedRoom);
    };

    const handleNameChange = () => {
        if (roomName.trim() && roomName !== room.name) {
            onUpdateRoom({...room, name: roomName.trim()});
        }
    }

    return (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{translate('Chat Settings')}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><XIcon className="h-5 w-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">{translate('Chat Name')}</label>
                        <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} onBlur={handleNameChange} className="w-full mt-1 input-style" />
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{translate('Current Members')} ({currentMembers.length})</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {currentMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <img src={member.avatarUrl} alt={member.name} className="h-8 w-8 rounded-full" />
                                        <span className="text-gray-800 dark:text-gray-200">{member.name} {member.id === room.ownerId ? `(${translate('Owner')})` : ''}</span>
                                    </div>
                                    {member.id !== room.ownerId && (
                                        <button onClick={() => handleRemoveMember(member.id)} className="text-xs text-red-600 hover:underline">{translate('Remove')}</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button onClick={onDeleteRequest} className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-500">
                        <TrashIcon className="h-5 w-5" /> {translate('Delete Chat')}
                    </button>
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">{translate('Close')}</button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{ room: ChatRoom; onClose: () => void; onDelete: () => void; }> = ({ room, onClose, onDelete }) => {
    const { translate } = useTranslate();
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{translate('Delete Chat?')}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {translate('Are you sure you want to permanently delete')} <span className="font-semibold">"{room.name}"</span>? {translate('This action cannot be undone.')}
                </p>
                <div className="mt-6 flex justify-center gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">{translate('Cancel')}</button>
                    <button onClick={onDelete} className="bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:bg-red-700">{translate('Delete')}</button>
                </div>
            </div>
        </div>
    )
};

const NoticeBanner: React.FC<{ notice: GlobalNotice; onDismiss: () => void; currentlySpokenId: string | null; }> = ({ notice, onDismiss, currentlySpokenId }) => {
    const { translate } = useTranslate();
    return (
        <div className="p-4 bg-amber-100 dark:bg-amber-900/50 border-b-2 border-amber-300 dark:border-amber-700 flex items-start gap-4">
            <MegaphoneIcon className="h-8 w-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
                <p className={`font-bold text-amber-800 dark:text-amber-200 ${currentlySpokenId === `notice-banner-title-${notice.id}` ? 'tts-highlight' : ''}`}>{translate('Official Notice')} from {notice.postedByName}</p>
                <p className={`mt-1 text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap ${currentlySpokenId === `notice-banner-text-${notice.id}` ? 'tts-highlight' : ''}`}>{notice.text}</p>
                {notice.imageUrl && (
                    <div className="mt-3">
                        <img src={notice.imageUrl} alt={translate("Notice attachment")} className="max-h-64 w-auto rounded-lg shadow-md border border-amber-200 dark:border-amber-700" />
                    </div>
                )}
            </div>
            <button onClick={onDismiss} className="p-1.5 rounded-full text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800 self-start">
                <XIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

const PinnedNoticeBar: React.FC<{ notice: GlobalNotice; onExpand: () => void; currentlySpokenId: string | null; }> = ({ notice, onExpand, currentlySpokenId }) => {
    const { translate } = useTranslate();
    return (
        <button onClick={onExpand} className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700">
            <MegaphoneIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <p className={`text-xs font-semibold text-gray-700 dark:text-gray-300 truncate ${currentlySpokenId === `pinned-notice-bar-${notice.id}` ? 'tts-highlight' : ''}`}>
                <span className="font-bold">{translate('Pinned Notice')}:</span> {notice.text}
            </p>
        </button>
    );
};

const CreateNoticeModal: React.FC<{ onClose: () => void; onPost: (text: string, imageUrl?: string) => void; }> = ({ onClose, onPost }) => {
    const { translate } = useTranslate();
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // Clean up object URL on unmount
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError(translate('Please select a valid image file.'));
                return;
            }
            setError('');
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        
        let imageUrl: string | undefined = undefined;
        if (imageFile) {
            try {
                imageUrl = await fileToDataUrl(imageFile);
            } catch (err) {
                setError(translate('Could not process image file.'));
                return;
            }
        }
        
        onPost(text.trim(), imageUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{translate('Post a New Notice')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="notice-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{translate('Notice Text')}</label>
                        <textarea id="notice-text" value={text} onChange={e => setText(e.target.value)} placeholder={translate('Enter your notice here...')} required rows={4} className="mt-1 w-full input-style" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{translate('Attach Image (Optional)')}</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="mx-auto h-24 object-contain" />
                                ) : (
                                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                )}
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-teal-600 hover:text-teal-500">
                                        <span>{translate('Upload a file')}</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">{translate('or drag and drop')}</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{imageFile ? imageFile.name : translate('PNG, JPG up to 5MB')}</p>
                            </div>
                        </div>
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">{translate('Cancel')}</button>
                        <button type="submit" className="bg-amber-500 text-black font-bold py-2 px-4 rounded-full hover:bg-amber-600 transition-colors">{translate('Post Notice')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;