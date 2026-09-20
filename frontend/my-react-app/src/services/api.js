import axios from "axios";
import collegesData from "../data/colleges.json";
import coursesData from "../data/courses.json";

const API_URL = "http://10.134.88.244:8000";

const API = axios.create({
  baseURL: `${API_URL}/api`,
});

// No authentication interceptor - public access only
API.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== PUBLIC ENDPOINTS ====================

// Password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await API.post("password-reset/", { email });
    return response.data;
  } catch (error) {
    console.error("Error requesting password reset:", error);
    throw error;
  }
};

export const confirmPasswordReset = async (resetData) => {
  try {
    const response = await API.post("password-reset-confirm/", resetData);
    return response.data;
  } catch (error) {
    console.error("Error confirming password reset:", error);
    throw error;
  }
};

// ==================== INLINED COLLEGES & COURSES ENDPOINTS ====================

// Colleges
export const getColleges = async (params = {}) => {
  try {
    let result = [...collegesData];
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(c =>
        c.college_name?.toLowerCase().includes(q) ||
        c.location_city?.toLowerCase().includes(q) ||
        c.short_name?.toLowerCase().includes(q)
      );
    }
    if (params.city && params.city !== "All") {
      result = result.filter(c => c.location_city === params.city);
    }
    if (params.category && params.category !== "All") {
      result = result.filter(c => {
        if (Array.isArray(c.courses_offered_display)) {
          return c.courses_offered_display.includes(params.category);
        }
        return c.courses_offered === params.category || c.category === params.category;
      });
    }
    return result;
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return collegesData;
  }
};

export const getCollegeDetail = async (id) => {
  try {
    const numericId = Number(id);
    const college = collegesData.find(c =>
      c.college_id === numericId ||
      c.id === numericId ||
      c.slug === String(id) ||
      c.college_name?.toLowerCase() === String(id).toLowerCase()
    );
    if (college) return college;
    throw new Error(`College with ID ${id} not found`);
  } catch (error) {
    console.error(`Error fetching college ${id}:`, error);
    throw error;
  }
};

export const getCollegeCourses = async (collegeId) => {
  try {
    const numericId = Number(collegeId);
    return coursesData.filter(c =>
      c.college === numericId ||
      c.college_details?.college_id === numericId
    );
  } catch (error) {
    console.log(`No courses found for college ${collegeId}`);
    return [];
  }
};

export const getCollegeFees = async (collegeId, params = {}) => {
  try {
    const response = await API.get(`colleges/${collegeId}/fees/`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching fees for college ${collegeId}:`, error);
    return [];
  }
};

// Hostels
export const getCollegeHostels = async (collegeId) => {
  try {
    const response = await API.get(`colleges/${collegeId}/hostels/`);
    return response.data;
  } catch (error) {
    console.log(`No hostels found for college ${collegeId}`);
    return [];
  }
};

export const getHostelDetail = async (hostelId) => {
  try {
    const response = await API.get(`hostels/${hostelId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching hostel ${hostelId}:`, error);
    throw error;
  }
};

export const getAvailableHostels = async (params = {}) => {
  try {
    const response = await API.get("hostels/", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching available hostels:", error);
    throw error;
  }
};

export const getHostelByRoomType = async (collegeId, roomType) => {
  try {
    const response = await API.get(`colleges/${collegeId}/hostels/${roomType}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching hostel with room type ${roomType}:`, error);
    throw error;
  }
};

export const suggestColleges = async (params = {}) => {
  try {
    const query = (params.q || params.search || "").toLowerCase();
    if (!query) return collegesData.slice(0, 5);
    return collegesData.filter(c =>
      c.college_name?.toLowerCase().includes(query) ||
      c.short_name?.toLowerCase().includes(query) ||
      c.location_city?.toLowerCase().includes(query)
    );
  } catch (error) {
    console.error("Error suggesting colleges:", error);
    return [];
  }
};

// Courses
export const getCourses = async (params = {}) => {
  try {
    let result = [...coursesData];
    if (params.category && params.category !== "All") {
      result = result.filter(c =>
        c.category === params.category ||
        c.category_display === params.category
      );
    }
    if (params.degree_type && params.degree_type !== "All") {
      result = result.filter(c =>
        c.degree_type === params.degree_type ||
        c.degree_type_display === params.degree_type
      );
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(c =>
        c.course_name?.toLowerCase().includes(q) ||
        c.course_name_display?.toLowerCase().includes(q) ||
        c.course_code?.toLowerCase().includes(q)
      );
    }
    return result;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return coursesData;
  }
};

export const getCourseDetail = async (id) => {
  try {
    const numericId = Number(id);
    const course = coursesData.find(c => c.course_id === numericId || c.id === numericId);
    if (course) return course;
    throw new Error(`Course with ID ${id} not found`);
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

export const getCourseFees = async (courseId) => {
  try {
    const response = await API.get(`courses/${courseId}/fees/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fees for course ${courseId}:`, error);
    return [];
  }
};

// Fees
export const getFilteredFees = async (params = {}) => {
  try {
    const response = await API.get("fees/filter/", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching filtered fees:", error);
    throw error;
  }
};

export const getFeeDetail = async (feeId) => {
  try {
    const response = await API.get(`fees/${feeId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fee ${feeId}:`, error);
    throw error;
  }
};

export const getFeeStatistics = async (params = {}) => {
  try {
    const response = await API.get("fees/statistics/", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching fee statistics:", error);
    throw error;
  }
};

export const getFeeComparison = async (collegeIds, params = {}) => {
  try {
    const queryParams = { ...params, college_ids: collegeIds };
    const response = await API.get("fees/comparison/", { params: queryParams });
    return response.data;
  } catch (error) {
    console.error("Error fetching fee comparison:", error);
    throw error;
  }
};

// Timeline Events
export const getTimelineEvents = async (params) => {
  try {
    const response = await API.get("timeline/", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching timeline events:", error);
    throw error;
  }
};

// ==================== HIERARCHICAL SELECTION ENDPOINTS ====================

export const getAllCollegesWithCategories = async () => {
  try {
    return collegesData.map(c => {
      const collegeCourses = coursesData.filter(cr => cr.college === c.college_id);
      const categoriesMap = {};
      collegeCourses.forEach(cr => {
        if (!categoriesMap[cr.category]) {
          categoriesMap[cr.category] = cr.category_display || cr.category;
        }
      });
      const categories = Object.keys(categoriesMap).map(code => ({
        code,
        name: categoriesMap[code]
      }));
      return { ...c, categories };
    });
  } catch (error) {
    console.error("Error fetching colleges with categories:", error);
    return collegesData;
  }
};

export const getCollegeCategories = async (collegeId) => {
  try {
    const numericId = Number(collegeId);
    const collegeCourses = coursesData.filter(c => c.college === numericId);
    const categoriesMap = {};
    collegeCourses.forEach(cr => {
      if (cr.category && !categoriesMap[cr.category]) {
        categoriesMap[cr.category] = cr.category_display || cr.category;
      }
    });
    const categories = Object.keys(categoriesMap).map(code => ({
      code,
      name: categoriesMap[code]
    }));
    return { success: true, categories };
  } catch (error) {
    console.error(`Error fetching categories for college ${collegeId}:`, error);
    return { success: false, categories: [] };
  }
};

export const getCategoryDegreeTypes = async (collegeId, category) => {
  try {
    const numericId = Number(collegeId);
    const filteredCourses = coursesData.filter(c => c.college === numericId && c.category === category);
    const degreeMap = {};
    filteredCourses.forEach(cr => {
      if (cr.degree_type && !degreeMap[cr.degree_type]) {
        degreeMap[cr.degree_type] = cr.degree_type_display || cr.degree_type.toUpperCase();
      }
    });
    const degree_types = Object.keys(degreeMap).map(code => ({
      code,
      name: degreeMap[code]
    }));
    return { success: true, degree_types };
  } catch (error) {
    console.error(`Error fetching degree types for college ${collegeId} category ${category}:`, error);
    return { success: false, degree_types: [] };
  }
};

export const getDegreeCourses = async (collegeId, category, degreeType) => {
  try {
    const numericId = Number(collegeId);
    const filteredCourses = coursesData.filter(c =>
      c.college === numericId &&
      c.category === category &&
      c.degree_type === degreeType
    );
    return { success: true, courses: filteredCourses };
  } catch (error) {
    console.error(`Error fetching courses:`, error);
    return { success: false, courses: [] };
  }
};

export const getCourseDetailsForSelection = async (courseId) => {
  try {
    const numericId = Number(courseId);
    const course = coursesData.find(c => c.course_id === numericId || c.id === numericId);
    return { success: true, course };
  } catch (error) {
    console.error(`Error fetching course details for ${courseId}:`, error);
    throw error;
  }
};

export const getCollegeHierarchy = async (collegeId) => {
  try {
    const numericId = Number(collegeId);
    const college = collegesData.find(c => c.college_id === numericId);
    const collegeCourses = coursesData.filter(c => c.college === numericId);
    return { success: true, college, courses: collegeCourses };
  } catch (error) {
    console.error(`Error fetching college hierarchy for ${collegeId}:`, error);
    throw error;
  }
};

// ==================== COLLEGE IMAGE ENDPOINTS ====================

export const getCollegeGallery = async (collegeId) => {
  try {
    const numericId = Number(collegeId);
    const college = collegesData.find(c => c.college_id === numericId);
    if (!college) return { college_images: [], campus_images: [] };
    return {
      college_images: college.college_images || [],
      campus_images: college.campus_images || [],
      banner_image: college.banner_image || ""
    };
  } catch (error) {
    console.error(`Error fetching gallery for college ${collegeId}:`, error);
    return { college_images: [], campus_images: [] };
  }
};

export const getCollegeImagesByCategory = async (collegeId, category) => {
  try {
    const gallery = await getCollegeGallery(collegeId);
    if (category === "college") return gallery.college_images;
    if (category === "campus") return gallery.campus_images;
    return [...(gallery.college_images || []), ...(gallery.campus_images || [])];
  } catch (error) {
    console.error(`Error fetching ${category} images:`, error);
    return [];
  }
};

export const getFeaturedColleges = async (limit = 6) => {
  try {
    return collegesData.slice(0, limit);
  } catch (error) {
    console.error("Error fetching featured colleges:", error);
    return collegesData.slice(0, limit);
  }
};

// ==================== COURSE CATEGORY ENDPOINTS ====================

export const getCourseCategories = async () => {
  try {
    const categoriesMap = {};
    coursesData.forEach(c => {
      if (c.category && !categoriesMap[c.category]) {
        categoriesMap[c.category] = c.category_display || c.category;
      }
    });
    return Object.keys(categoriesMap).map(code => ({
      code,
      name: categoriesMap[code]
    }));
  } catch (error) {
    console.error("Error fetching course categories:", error);
    return [];
  }
};

export const getCollegesByCategory = async (params = {}) => {
  try {
    const category = params.category;
    if (!category) return collegesData;
    const matchingCollegeIds = new Set(
      coursesData.filter(c => c.category === category || c.category_display === category).map(c => c.college)
    );
    return collegesData.filter(c => matchingCollegeIds.has(c.college_id));
  } catch (error) {
    console.error("Error fetching colleges by category:", error);
    return collegesData;
  }
};

export const getCoursesByCategory = async (params = {}) => {
  try {
    const category = params.category;
    if (!category) return coursesData;
    return coursesData.filter(c => c.category === category || c.category_display === category);
  } catch (error) {
    console.error("Error fetching courses by category:", error);
    return coursesData;
  }
};

// ==================== APPLICATION FORM ====================

export const getApplicationFormData = async () => {
  try {
    const categoriesMap = {};
    coursesData.forEach(c => {
      if (c.category && !categoriesMap[c.category]) {
        categoriesMap[c.category] = c.category_display || c.category;
      }
    });
    const categories = Object.keys(categoriesMap).map(code => ({
      code,
      name: categoriesMap[code]
    }));
    return {
      colleges: collegesData,
      categories
    };
  } catch (error) {
    console.error('Error fetching application form data:', error);
    return { colleges: collegesData, categories: [] };
  }
};

// Submit application - NO AUTHENTICATION REQUIRED
export const submitApplication = async (formData) => {
  try {
    const response = await API.post('/submit-application/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting application:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const submitApplicationV2 = async (formData) => {
  try {
    const response = await API.post('/submit-application-v2/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting application V2:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const submitScholarshipApplication = async (formData) => {
  try {
    const response = await API.post('/submit-scholarship-application/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting scholarship application:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Get applications (public)
export const getMyApplications = async () => {
  try {
    const response = await API.get('/my-applications/');
    return response.data;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
};

// Download application PDF
export const downloadApplicationPDF = async (applicationId) => {
  try {
    const response = await API.get(`/download-application-pdf/${applicationId}/`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

// Get single application details
export const getApplicationDetail = async (applicationId) => {
  try {
    const response = await API.get(`/my-applications/${applicationId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching application detail:', error);
    throw error;
  }
};

export default API;
