import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../../shared/ui/Modal';
import { Project, Client, ChatMessage, Profile } from '../../../types';
import { SendIcon, WhatsappIcon } from '../../../constants';
import { CHAT_TEMPLATES, cleanPhoneNumber } from '../../../constants';
import { useChatTemplates } from '../../../hooks/useChatTemplates';
import { formatIdNumber } from '../../../utils/currency';
import { toPublicNameSlug } from '../../../utils/publicRouting';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    client: Client;
    onSendMessage: (projectId: string, messageText: string) => void;
    userProfile?: Profile;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, project, client, onSendMessage, userProfile }) => {
    const { templates, processTemplate: processTemplateFunc } = useChatTemplates(userProfile);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [project.chatHistory, isOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(project.id, newMessage.trim());
            setNewMessage('');
        }
    };

    const handleSelectTemplate = (template: string) => {
        const sisaTagihan = (project.totalCost || 0) - (project.amountPaid || 0);
        
        const portalBaseUrl = `${window.location.origin}${window.location.pathname}#/portal/`;
        const portalLink = client.name ? `${portalBaseUrl}${toPublicNameSlug(client.name)}` : '';

        const processedMessage = processTemplateFunc(template, {
            clientName: client.name,
            projectName: project.projectName,
            packageName: project.packageName || '-',
            amountPaid: 'Rp ' + formatIdNumber(project.amountPaid || 0),
            totalCost: 'Rp ' + formatIdNumber(project.totalCost || 0),
            sisaTagihan: 'Rp ' + formatIdNumber(sisaTagihan),
            portalLink: portalLink,
        });
        setNewMessage(processedMessage);
    };

    const handleShareToWhatsApp = () => {
        if (!client.phone) {
            alert('Nomor telepon pengantin tidak tersedia.');
            return;
        }
        if (!newMessage.trim()) {
            alert('Tulis pesan terlebih dahulu atau pilih dari template.');
            return;
        }
        const phoneNumber = cleanPhoneNumber(client.phone);
        const encodedMessage = encodeURIComponent(newMessage);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Chat dengan ${client.name}`}
            size="lg"
        >
            <div className="flex flex-col h-full">
                <p className="text-sm text-brand-text-secondary mb-4">Acara Pernikahan: {project.projectName}</p>
                
                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4 chat-modal-messages bg-brand-bg/50 rounded-xl mb-4">
                    {(project.chatHistory || []).map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'client' && (
                                <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center font-bold text-brand-accent text-sm flex-shrink-0">
                                    {client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'vendor' ? 'bg-brand-accent text-white rounded-br-none' : 'bg-white border border-brand-border text-brand-text-primary rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border border-brand-border flex-shrink-0 bg-white rounded-xl">
                    <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                        {templates.map(template => (
                            <button key={template.id} type="button" onClick={() => handleSelectTemplate(template.template)} className="button-secondary !min-h-0 !h-auto flex-shrink-0 !text-[10px] !px-3 !py-1.5 whitespace-nowrap rounded-full">
                                {template.title}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="space-y-3">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ketik pesan..."
                            className="input-field w-full rounded-lg text-sm p-3"
                            rows={4}
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="button-primary rounded-lg flex-grow flex items-center justify-center gap-2" title="Kirim Pesan">
                                <SendIcon className="w-4 h-4" /> Kirim Pesan
                            </button>
                            <button type="button" onClick={handleShareToWhatsApp} className="button-secondary h-full aspect-square flex items-center justify-center !border-green-500/20 !text-green-500 hover:!bg-green-500/10" title="Bagikan ke WhatsApp">
                                <WhatsappIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default ChatModal;