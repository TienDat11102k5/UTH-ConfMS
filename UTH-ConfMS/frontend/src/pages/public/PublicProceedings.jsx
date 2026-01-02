import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import logoUth from "../../assets/logoUTH.jpg";
import UserProfileDropdown from "../../components/UserProfileDropdown";
import { FiDownload, FiFilter, FiSearch } from "react-icons/fi";
import "../../styles/PublicProceedings.css";

const PublicProceedings = () => {
  const { conferenceId } = useParams();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken");
    const userStr =
      sessionStorage.getItem("currentUser") ||
      localStorage.getItem("currentUser");

    if (token && userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  useEffect(() => {
    fetchConferences();
  }, []);

  useEffect(() => {
    if (conferenceId) {
      setSelectedConference(conferenceId);
      fetchProceedings(conferenceId);
    }
  }, [conferenceId]);

  const fetchConferences = async () => {
    try {
      const response = await apiClient.get("/conferences", { skipAuth: true });
      setConferences(response.data);

      if (conferenceId) {
        fetchProceedings(conferenceId);
      } else if (response.data?.length > 0) {
        fetchAllProceedings(response.data);
      } else {
        setError("Chưa có hội nghị nào trong hệ thống.");
        setLoading(false);
      }
    } catch (err) {
      setError("Không thể tải danh sách hội nghị.");
      setLoading(false);
    }
  };

  const fetchAllProceedings = async (confs) => {
    try {
      setLoading(true);
      const all = [];
      for (const conf of confs) {
        const res = await apiClient.get(`/proceedings/${conf.id}`, {
          skipAuth: true,
        });
        all.push(...res.data);
      }
      setProceedings(all);
    } catch {
      setError("Không thể tải danh sách kỷ yếu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProceedings = async (id) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/proceedings/${id}`, {
        skipAuth: true,
      });
      setProceedings(res.data);
    } catch {
      setError("Không thể tải danh sách kỷ yếu.");
      setProceedings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConferenceChange = (e) => {
    const id = e.target.value;
    setSelectedConference(id);
    setSearchQuery("");
    setSelectedTrack("ALL");
    setCurrentPage(1);

    id ? fetchProceedings(id) : fetchAllProceedings(conferences);
  };

  const handleDownload = async (paperId, title) => {
    try {
      const res = await apiClient.get(`/proceedings/download/${paperId}`, {
        responseType: "blob",
        skipAuth: true,
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Không thể tải file.");
    }
  };

  const tracks = [
    ...new Set(proceedings.map((p) => p.trackName).filter(Boolean)),
  ];

  const filteredProceedings = proceedings.filter((p) => {
    const matchTrack =
      selectedTrack === "ALL" || p.trackName === selectedTrack;
    const authors = p.coAuthors
      ? `${p.authorName} ${p.coAuthors}`
      : p.authorName || "";
    const matchSearch =
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      authors.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTrack && matchSearch;
  });

  const totalPages = Math.ceil(filteredProceedings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filteredProceedings.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTrack]);

  if (loading) return <div className="loading-state">Đang tải...</div>;

  return (
    <div className="proceedings-page-modern">
      {/* Filter */}
      {proceedings.length > 0 && (
        <div className="filter-box">
          <div>
            <label
              style={{
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                marginBottom: "0.5rem",
              }}
            >
              <FiFilter size={14} />
              Lọc theo chủ đề:
            </label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              {tracks.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                marginBottom: "0.5rem",
              }}
            >
              <FiSearch size={14} />
              Tìm kiếm:
            </label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, tác giả..."
            />
          </div>
        </div>
      )}

      {/* Table */}
      {paginated.map((p) => (
        <div key={p.paperId}>
          {p.title}
          <button onClick={() => handleDownload(p.paperId, p.title)}>
            <FiDownload /> PDF
          </button>
        </div>
      ))}
    </div>
  );
};

export default PublicProceedings;
