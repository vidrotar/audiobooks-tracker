import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Star, Clock, User, Headphones, Filter, Edit3, Trash2, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE = '/api';

function App() {
    const [audiobooks, setAudiobooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        narrator: '',
        duration: '',
        genre: '',
        description: '',
        date_started_listening: '',
        date_end_listened: '',
        notes: '',
        status: 'completed',
        rating: ''
    });

    useEffect(() => {
        fetchAudiobooks();
        fetchStats();
    }, []);

    useEffect(() => {
        filterAudiobooks();
    }, [audiobooks, searchTerm, filterStatus]);

    const fetchAudiobooks = async () => {
        try {
            const response = await axios.get(`${API_BASE}/audiobooks`);
            setAudiobooks(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching audiobooks:', error);
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const filterAudiobooks = () => {
        let filtered = audiobooks;

        if (searchTerm) {
            filtered = filtered.filter(book =>
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.narrator?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(book => book.status === filterStatus);
        }

        setFilteredBooks(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBook) {
                await axios.put(`${API_BASE}/audiobooks/${editingBook.id}`, formData);
            } else {
                await axios.post(`${API_BASE}/audiobooks`, formData);
            }

            fetchAudiobooks();
            fetchStats();
            resetForm();
        } catch (error) {
            console.error('Error saving audiobook:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this audiobook?')) {
            try {
                await axios.delete(`${API_BASE}/audiobooks/${id}`);
                fetchAudiobooks();
                fetchStats();
            } catch (error) {
                console.error('Error deleting audiobook:', error);
            }
        }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title || '',
            author: book.author || '',
            narrator: book.narrator || '',
            duration: book.duration || '',
            genre: book.genre || '',
            description: book.description || '',
            date_started_listening: book.date_started_listening ? book.date_started_listening.split('T')[0] : '',
            date_end_listened: book.date_end_listened ? book.date_end_listened.split('T')[0] : '',
            notes: book.notes || '',
            status: book.status || 'completed',
            rating: book.rating || ''
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            author: '',
            narrator: '',
            duration: '',
            genre: '',
            description: '',
            date_started_listening: '',
            date_end_listened: '',
            notes: '',
            status: 'completed',
            rating: ''
        });
        setShowAddForm(false);
        setEditingBook(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'listening': return 'text-blue-600 bg-blue-100';
            case 'to_listen': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const renderStars = (rating) => {
        if (!rating) return null;
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Headphones className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-xl text-gray-600">Loading your audiobook library...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Headphones className="w-12 h-12 text-primary-500 mr-3" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                            Vid's Audiobook Library
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">Track, discover, and organize your audiobook journey</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="glass-card rounded-xl p-6 text-center">
                        <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-800">{stats.total || 0}</div>
                        <div className="text-gray-600">Total Books</div>
                    </div>
                    <div className="glass-card rounded-xl p-6 text-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{stats.completed || 0}</div>
                        <div className="text-gray-600">Completed</div>
                    </div>
                    <div className="glass-card rounded-xl p-6 text-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{stats.listening || 0}</div>
                        <div className="text-gray-600">Currently Listening</div>
                    </div>
                    <div className="glass-card rounded-xl p-6 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{stats.to_listen || 0}</div>
                        <div className="text-gray-600">To Listen</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="glass-card rounded-xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search audiobooks..."
                                    className="input-field pl-10 md:w-80"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    className="input-field pl-10 pr-8"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="listening">Currently Listening</option>
                                    <option value="to_listen">To Listen</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Audiobook
                        </button>
                    </div>
                </div>

                {/* Add/Edit Form Modal */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="glass-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                {editingBook ? 'Edit Audiobook' : 'Add New Audiobook'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Narrator</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.narrator}
                                            onChange={(e) => setFormData({ ...formData, narrator: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 8h 30m"
                                            className="input-field"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.genre}
                                            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            className="input-field"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="completed">Completed</option>
                                            <option value="listening">Currently Listening</option>
                                            <option value="to_listen">To Listen</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                                        <select
                                            className="input-field"
                                            value={formData.rating}
                                            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        >
                                            <option value="">No Rating</option>
                                            <option value="1">1 Star</option>
                                            <option value="2">2 Stars</option>
                                            <option value="3">3 Stars</option>
                                            <option value="4">4 Stars</option>
                                            <option value="5">5 Stars</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Listened</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={formData.date_started_listening}
                                            onChange={(e) => setFormData({ ...formData, date_started_listening: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Listened</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={formData.date_end_listened}
                                            onChange={(e) => setFormData({ ...formData, date_end_listened: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        className="input-field h-24 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        className="input-field h-24 resize-none"
                                        placeholder="Your thoughts, favorite quotes, etc..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="btn-primary flex-1">
                                        {editingBook ? 'Update Audiobook' : 'Add Audiobook'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="btn-secondary px-6"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Audiobooks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBooks.map((book) => (
                        <div key={book.id} className="book-card group">
                            <div className="flex items-start gap-4">
                                {book.cover_url ? (
                                    <img
                                        src={book.cover_url}
                                        alt={book.title}
                                        className="w-20 h-28 object-cover rounded-lg shadow-md flex-shrink-0"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-20 h-28 bg-gradient-to-br from-primary-400 to-indigo-500 rounded-lg shadow-md flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-lg text-gray-800 line-clamp-2 leading-tight">
                                            {book.title}
                                        </h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(book)}
                                                className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(book.id)}
                                                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {book.author && (
                                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                                            <User className="w-3 h-3" />
                                            <span className="text-sm">{book.author}</span>
                                        </div>
                                    )}

                                    {book.narrator && (
                                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                                            <Headphones className="w-3 h-3" />
                                            <span className="text-sm">{book.narrator}</span>
                                        </div>
                                    )}

                                    {book.duration && (
                                        <div className="flex items-center gap-1 text-gray-600 mb-2">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-sm">{book.duration}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                      {book.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>

                                        {book.rating && (
                                            <div className="flex items-center gap-1">
                                                {renderStars(parseFloat(book.rating))}
                                            </div>
                                        )}
                                    </div>

                                    {book.genre && (
                                        <div className="mt-2">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {book.genre}
                      </span>
                                        </div>
                                    )}

                                    {book.date_end_listened && (
                                        <div className="flex items-center gap-1 text-gray-500 mt-2">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-xs">
                        Listened: {new Date(book.date_end_listened).toLocaleDateString()}
                      </span>
                                        </div>
                                    )}

                                    {book.date_started_listening && (
                                        <div className="flex items-center gap-1 text-gray-500 mt-2">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-xs">
                        Listened: {new Date(book.date_started_listening).toLocaleDateString()}
                      </span>
                                        </div>
                                    )}

                                    {book.description && (
                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                                            {book.description}
                                        </p>
                                    )}

                                    {book.notes && (
                                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                            <p className="text-gray-700 text-xs italic line-clamp-2">
                                                "{book.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredBooks.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-500 mb-2">
                            {searchTerm || filterStatus !== 'all' ? 'No audiobooks found' : 'No audiobooks yet'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : 'Start building your audiobook library by adding your first book'
                            }
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="btn-primary"
                            >
                                Add Your First Audiobook
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;