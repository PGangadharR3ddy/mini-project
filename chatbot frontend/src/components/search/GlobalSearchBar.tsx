import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FolderArchive,
  BellRing,
  FolderGit2,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  FileText,
  Building2,
  Tag,
  CornerDownLeft,
} from 'lucide-react';
import { getResources } from '../../api/resources';
import { getAnnouncementsFeed } from '../../api/announcements';
import { getAllProjects } from '../../api/projects';
import { Resource, Announcement, Project } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export type SearchCategory = 'ALL' | 'RESOURCES' | 'ANNOUNCEMENTS' | 'PROJECTS';

interface SearchResultItem {
  id: string;
  category: 'RESOURCE' | 'ANNOUNCEMENT' | 'PROJECT';
  title: string;
  snippet: string;
  meta: string;
  badge?: string;
  badgeColor?: string;
  url: string;
  timestamp?: string;
}

const RECENT_SEARCHES_KEY = 'smart_classroom_recent_searches';
const POPULAR_TAGS = ['Notes', 'Assignment', 'Exam', 'React', 'AI', 'IoT', 'Timetable'];

export const GlobalSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { classroomId, department } = useAuth();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Cached dataset
  const [resources, setResources] = useState<Resource[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  // Platform shortcut detection (Mac vs Win)
  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  }, []);

  // Fetch index data on first focus/open
  const loadSearchIndex = useCallback(async () => {
    if (hasLoadedData || isLoadingData) return;
    setIsLoadingData(true);
    try {
      const [resData, annData, prjData] = await Promise.all([
        getResources(classroomId || '').catch(() => []),
        getAnnouncementsFeed(classroomId || undefined, department || undefined).catch(() => []),
        getAllProjects().catch(() => []),
      ]);
      setResources(resData);
      setAnnouncements(annData);
      setProjects(prjData);
      setHasLoadedData(true);
    } catch (err) {
      console.error('Failed to load global search data', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [classroomId, department, hasLoadedData, isLoadingData]);

  // Global keyboard shortcut (⌘K or Ctrl+K, or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        loadSearchIndex();
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        loadSearchIndex();
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loadSearchIndex]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items across resources, announcements, and projects
  const filteredResults = useMemo<SearchResultItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const items: SearchResultItem[] = [];

    // 1. Resources
    if (selectedCategory === 'ALL' || selectedCategory === 'RESOURCES') {
      resources.forEach((r) => {
        const titleMatch = r.title.toLowerCase().includes(trimmed);
        const descMatch = (r.description || '').toLowerCase().includes(trimmed);
        const subjectMatch = r.subject.toLowerCase().includes(trimmed);
        const fileMatch = r.fileName.toLowerCase().includes(trimmed);
        const typeMatch = r.type.toLowerCase().includes(trimmed);

        if (titleMatch || descMatch || subjectMatch || fileMatch || typeMatch) {
          items.push({
            id: `res-${r.id}`,
            category: 'RESOURCE',
            title: r.title,
            snippet: r.description || `Subject: ${r.subject} · ${r.fileName}`,
            meta: `${r.subject} · ${r.type} · ${r.fileSize}`,
            badge: r.type,
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            url: `/resources?q=${encodeURIComponent(r.title)}`,
            timestamp: r.uploadedDate,
          });
        }
      });
    }

    // 2. Announcements
    if (selectedCategory === 'ALL' || selectedCategory === 'ANNOUNCEMENTS') {
      announcements.forEach((a) => {
        const titleMatch = a.title.toLowerCase().includes(trimmed);
        const contentMatch = a.content.toLowerCase().includes(trimmed);
        const authorMatch = a.authorName.toLowerCase().includes(trimmed);
        const deptMatch = (a.department || '').toLowerCase().includes(trimmed);
        const tagMatch = (a.tags || []).some((t) => t.toLowerCase().includes(trimmed));

        if (titleMatch || contentMatch || authorMatch || deptMatch || tagMatch) {
          items.push({
            id: `ann-${a.id}`,
            category: 'ANNOUNCEMENT',
            title: a.title,
            snippet: a.content.slice(0, 110) + (a.content.length > 110 ? '...' : ''),
            meta: `By ${a.authorName} · ${a.type} Priority: ${a.priority}`,
            badge: a.type,
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
            url: `/announcements?q=${encodeURIComponent(a.title)}`,
            timestamp: a.createdAt,
          });
        }
      });
    }

    // 3. Projects
    if (selectedCategory === 'ALL' || selectedCategory === 'PROJECTS') {
      projects.forEach((p) => {
        const titleMatch = p.title.toLowerCase().includes(trimmed);
        const descMatch = p.description.toLowerCase().includes(trimmed);
        const techMatch = (p.techStack || '').toLowerCase().includes(trimmed);
        const tagMatch = (p.tags || []).some((t) => t.toLowerCase().includes(trimmed));
        const ownerMatch = p.ownerName.toLowerCase().includes(trimmed);

        if (titleMatch || descMatch || techMatch || tagMatch || ownerMatch) {
          items.push({
            id: `prj-${p.id}`,
            category: 'PROJECT',
            title: p.title,
            snippet: p.description.slice(0, 110) + (p.description.length > 110 ? '...' : ''),
            meta: `Tech: ${p.techStack} · Status: ${p.status} · By ${p.ownerName}`,
            badge: p.status,
            badgeColor:
              p.status === 'OPEN'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : p.status === 'IN_PROGRESS'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-700 border-slate-200',
            url: `/projects/${p.id}`,
            timestamp: p.createdAt,
          });
        }
      });
    }

    return items;
  }, [query, selectedCategory, resources, announcements, projects]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const saveRecentSearch = (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    const updated = [cleanText, ...recentSearches.filter((s) => s.toLowerCase() !== cleanText.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(query || item.title);
    setIsOpen(false);
    navigate(item.url);
  };

  // Keyboard navigation inside dropdown (Up, Down, Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
        scrollSelectedIntoView((selectedIndex + 1) % filteredResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
        scrollSelectedIntoView((selectedIndex - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      } else if (query.trim()) {
        // Fallback: navigate to current category page with query
        saveRecentSearch(query);
        setIsOpen(false);
        if (selectedCategory === 'RESOURCES') {
          navigate(`/resources?q=${encodeURIComponent(query.trim())}`);
        } else if (selectedCategory === 'ANNOUNCEMENTS') {
          navigate(`/announcements?q=${encodeURIComponent(query.trim())}`);
        } else if (selectedCategory === 'PROJECTS') {
          navigate(`/projects?q=${encodeURIComponent(query.trim())}`);
        } else {
          // If all, navigate to resources or projects
          navigate(`/resources?q=${encodeURIComponent(query.trim())}`);
        }
      }
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    if (!resultsListRef.current) return;
    const items = resultsListRef.current.querySelectorAll('[data-search-item]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  // Category counts
  const counts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return {
        all: resources.length + announcements.length + projects.length,
        resources: resources.length,
        announcements: announcements.length,
        projects: projects.length,
      };
    }
    const rCount = resources.filter(
      (r) =>
        r.title.toLowerCase().includes(trimmed) ||
        (r.description || '').toLowerCase().includes(trimmed) ||
        r.subject.toLowerCase().includes(trimmed) ||
        r.fileName.toLowerCase().includes(trimmed)
    ).length;

    const aCount = announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(trimmed) ||
        a.content.toLowerCase().includes(trimmed) ||
        a.authorName.toLowerCase().includes(trimmed) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(trimmed))
    ).length;

    const pCount = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(trimmed) ||
        p.description.toLowerCase().includes(trimmed) ||
        (p.techStack || '').toLowerCase().includes(trimmed) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(trimmed)) ||
        p.ownerName.toLowerCase().includes(trimmed)
    ).length;

    return {
      all: rCount + aCount + pCount,
      resources: rCount,
      announcements: aCount,
      projects: pCount,
    };
  }, [query, resources, announcements, projects]);

  return (
    <div ref={searchContainerRef} className="relative flex-1 max-w-lg mx-2 lg:mx-4">
      {/* Search Input Bar */}
      <div
        className={`relative flex items-center w-full transition-all duration-200 rounded-xl bg-slate-100/90 hover:bg-slate-100 border ${
          isOpen
            ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-xs'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          id="global-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            loadSearchIndex();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search resources, announcements, projects..."
          className="w-full py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button or Shortcut Hint */}
        <div className="flex items-center pr-2.5 gap-1.5">
          {query ? (
            <button
              type="button"
              id="clear-global-search"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white/80 border border-slate-200 rounded shadow-2xs select-none">
              <span>{isMac ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Results Popover */}
      {isOpen && (
        <div
          id="global-search-popover"
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Category Filter Tabs */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-1 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600 font-mono">
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('RESOURCES')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === 'RESOURCES'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resources</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600 font-mono">
                {counts.resources}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('ANNOUNCEMENTS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === 'ANNOUNCEMENTS'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600" />
              <span>Announcements</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600 font-mono">
                {counts.announcements}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('PROJECTS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === 'PROJECTS'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Projects</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600 font-mono">
                {counts.projects}
              </span>
            </button>
          </div>

          {/* Results List or Empty/Recent States */}
          <div ref={resultsListRef} className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {isLoadingData && !hasLoadedData ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Indexing resources, announcements & projects...</span>
              </div>
            ) : query.trim() ? (
              filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-search-item
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3 transition-colors flex items-start gap-3 ${
                        isSelected ? 'bg-indigo-50/70 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {/* Category Icon */}
                      <div className="mt-0.5 shrink-0">
                        {item.category === 'RESOURCE' && (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                            <FolderArchive className="w-4 h-4" />
                          </div>
                        )}
                        {item.category === 'ANNOUNCEMENT' && (
                          <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center">
                            <BellRing className="w-4 h-4" />
                          </div>
                        )}
                        {item.category === 'PROJECT' && (
                          <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
                            <FolderGit2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">
                            {item.category.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.snippet}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="truncate">{item.meta}</span>
                        </div>
                      </div>

                      {/* Enter hint */}
                      {isSelected && (
                        <div className="shrink-0 self-center hidden sm:flex items-center text-slate-400">
                          <CornerDownLeft className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs font-semibold text-slate-700">No matches found for "{query}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try searching with different terms or select "All" categories.
                  </p>
                </div>
              )
            ) : (
              /* Empty Query State: Recent Searches & Quick Links */
              <div className="p-4 space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                      <span className="uppercase tracking-wider">Recent Searches</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem(RECENT_SEARCHES_KEY);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-[10px]"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setQuery(term);
                            inputRef.current?.focus();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg transition-colors"
                        >
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Topics */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Popular Topics
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setQuery(tag);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 rounded-lg transition-colors"
                      >
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Navigation
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/resources');
                      }}
                      className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/70 hover:border-emerald-200 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                        <FolderArchive className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resources</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Notes, slides & papers</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/announcements');
                      }}
                      className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200/70 hover:border-amber-200 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-amber-700">
                        <BellRing className="w-3.5 h-3.5 text-amber-600" />
                        <span>Announcements</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Alerts & circulars</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/projects');
                      }}
                      className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-indigo-700">
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Collab Projects</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Team collaboration</p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Hints */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                  ↑↓
                </kbd>{' '}
                to navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                  ↵
                </kbd>{' '}
                to select
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                  esc
                </kbd>{' '}
                to close
              </span>
            </div>

            {query.trim() && (
              <button
                type="button"
                onClick={() => {
                  saveRecentSearch(query);
                  setIsOpen(false);
                  if (selectedCategory === 'RESOURCES') {
                    navigate(`/resources?q=${encodeURIComponent(query.trim())}`);
                  } else if (selectedCategory === 'ANNOUNCEMENTS') {
                    navigate(`/announcements?q=${encodeURIComponent(query.trim())}`);
                  } else if (selectedCategory === 'PROJECTS') {
                    navigate(`/projects?q=${encodeURIComponent(query.trim())}`);
                  } else {
                    navigate(`/resources?q=${encodeURIComponent(query.trim())}`);
                  }
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 text-[11px]"
              >
                <span>View all in {selectedCategory.toLowerCase()}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
