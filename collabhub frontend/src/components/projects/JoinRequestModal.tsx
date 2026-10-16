import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Send, Sparkles } from 'lucide-react';

interface JoinRequestModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  onSubmit: (message: string) => Promise<void>;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  id = 'join-request-modal',
  isOpen,
  onClose,
  projectTitle,
  onSubmit,
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setMessage('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please include a brief note explaining your skills or interest.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit(message.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title="Request to Join Team"
      subtitle={`Send a collaboration proposal to the project lead for "${projectTitle}"`}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            id={`${id}-cancel-btn`}
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={`${id}-form`}
            id={`${id}-submit-btn`}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending Request...' : 'Send Request'}
          </button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label htmlFor={`${id}-message`} className="block text-xs font-bold text-slate-700 mb-1">
            Proposal Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            id={`${id}-message`}
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share why you'd like to collaborate, your technical background, hours of availability, or prior projects..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 resize-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            The project owner will review your request and can accept you into their team.
          </p>
        </div>
      </form>
    </Modal>
  );
};
