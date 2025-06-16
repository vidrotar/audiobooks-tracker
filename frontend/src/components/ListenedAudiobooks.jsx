import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, User, Calendar } from 'lucide-react';

function ListenedAudiobooks() {
    const [audiobooks, setAudiobooks] = useState([]);

    useEffect(() => {
        axios.get('/api/audiobooks/listened')
            .then(res => setAudiobooks(res.data))
            .catch(() => setAudiobooks([]));
    }, []);

    return (
        <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary-500" />
                Lestvica poslušanih knjig
            </h2>
            <ol className="space-y-4">
                {audiobooks.map(book => (
                    <li key={book.id} className="flex items-start gap-4 border-b pb-4 last:border-b-0">
                        <span className="text-lg font-bold text-gray-400 w-6 flex-shrink-0">{book.number}.</span>
                        <div className="flex-1">
                            <div className="font-semibold text-lg text-gray-800">{book.title}</div>
                            <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                                <User className="w-4 h-4" />
                                {book.author || 'Unknown'}
                                <Calendar className="w-4 h-4 ml-4" />
                                {book.date_started_listening
                                    ? new Date(book.date_started_listening).toLocaleDateString()
                                    : 'N/A'}
                            </div>
                        </div>
                    </li>
                ))}
                {audiobooks.length === 0 && (
                    <li className="text-gray-500">No listened audiobooks yet.</li>
                )}
            </ol>
        </div>
    );
}

export default ListenedAudiobooks;