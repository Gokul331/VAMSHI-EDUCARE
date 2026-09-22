import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/applicationForm.css';
import { FaGraduationCap, FaUserGraduate, FaUsers, FaMapMarkerAlt, FaBookOpen, FaUniversity, FaArrowRight, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import {
  submitApplication,
  getColleges,
  getCollegeCategories,
  getCategoryDegreeTypes,
  getDegreeCourses,
} from '../services/api';

// Success Icon Component
const SuccessIconWithBurst = () => {
  const confetti = Array.from({ length: 24 });

  return (
    <div className="success-container">
      <motion.div
        className="success-ripple"
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      />
      <motion.div
        className="success-ripple success-ripple-2"
        initial={{ scale: 0, opacity: 0.4 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      />
      <motion.div
        className="success-circle"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
      >
        <FaCheckCircle className="success-check-icon" />
      </motion.div>
      {confetti.map((_, i) => {
        const angle = (i / confetti.length) * Math.PI * 2;
        const distance = 100 + Math.random() * 30;
        const rotation = Math.random() * 360;
        return (
          <motion.div
            key={i}
            className="confetti-particle"
            style={{ backgroundColor: `hsl(${Math.random() * 360}, 80%, 55%)` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0, scale: 1, rotate: rotation }}
            transition={{ duration: 0.8, delay: 0.3 + Math.random() * 0.2, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
};

// ---- Course ID helpers ----
// The backend returns the course identifier as either `id` or `course_id`
// depending on which endpoint is used. These helpers resolve it safely
// and reject the literal strings "undefined" / "null" / "NaN".
const resolveCourseId = (course) => {
  if (!course) return null;
  const raw = course.id ?? course.course_id ?? null;
  if (raw === null || raw === undefined) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

const isValidCourseValue = (value) => {
  if (value === '' || value === null || value === undefined) return false;
  if (value === 'undefined' || value === 'null' || value === 'NaN') return false;
  return Number.isFinite(Number(value));
};

function ApplicationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { college: passedCollege, course: passedCourse } = location.state || {};

  // Hierarchical selection states
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(passedCollege?.college_id || '');
  const [collegeName, setCollegeName] = useState(passedCollege?.college_name || '');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const [degreeTypes, setDegreeTypes] = useState([]);
  const [selectedDegreeType, setSelectedDegreeType] = useState('');
  const [selectedDegreeTypeName, setSelectedDegreeTypeName] = useState('');

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(
    passedCourse?.course_id ? String(passedCourse.course_id) : ''
  );
  const [selectedCourseName, setSelectedCourseName] = useState(passedCourse?.course_name || '');
  const [selectedDepartment, setSelectedDepartment] = useState(passedCourse?.course_code || '');

  const [loadingFields, setLoadingFields] = useState({
    categories: false,
    degreeTypes: false,
    courses: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
    date_of_birth: '',
    email_id: '',
    aadhar_number: '',
    father_name: '',
    father_mobile: '',
    mother_name: '',
    mother_mobile: '',
    address_line1: '',
    address_line2: '',
    city: '',
    pincode: '',
    gender: '',
    community: '',
    blood_group: '',
    tenth_marks_percentage: '',
    twelfth_marks_percentage: '',
    reference_name: ''
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate date limits for date of birth picker
  const getDateLimits = () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());

    const minDateStr = minDate.toISOString().split('T')[0];
    const maxDateStr = maxDate.toISOString().split('T')[0];

    return { min: minDateStr, max: maxDateStr };
  };

  const dateLimits = getDateLimits();

  // Format Aadhar number with spaces (xxxx xxxx xxxx)
  const formatAadhar = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const truncated = cleaned.slice(0, 12);
    const formatted = truncated.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Format mobile number (limit to 10 digits)
  const formatMobile = (value) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  // Format pincode (limit to 6 digits)
  const formatPincode = (value) => {
    return value.replace(/\D/g, '').slice(0, 6);
  };

  // Format percentage (limit to 3 digits before decimal, 2 after)
  const formatPercentage = (value) => {
    let cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[0].length > 3) {
      parts[0] = parts[0].slice(0, 3);
      cleaned = parts.join('.');
    }
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    if (cleaned.length > 6) {
      cleaned = cleaned.slice(0, 6);
    }
    return cleaned;
  };

  // Validation Functions
  const validateMobileNumber = (number) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!number) return 'Mobile number is required';
    if (!mobileRegex.test(number)) return 'Enter a valid 10-digit mobile number starting with 6,7,8,9';
    return '';
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return 'Date of birth is required';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 15) return 'Age must be 15 years or above';
    if (age > 100) return 'Please enter a valid date of birth';
    return '';
  };

  const validatePercentage = (percentage, fieldName) => {
    if (!percentage) return `${fieldName} is required`;
    const num = parseFloat(percentage);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num < 0 || num > 100) return `${fieldName} must be between 0 and 100`;
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Enter a valid email address';
    return '';
  };

  const validateAadhar = (aadhar) => {
    if (!aadhar) return 'Aadhar number is required';
    const cleanAadhar = aadhar.replace(/\s/g, '');
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(cleanAadhar)) return 'Aadhar number must be 12 digits';
    return '';
  };

  const validatePincode = (pincode) => {
    if (!pincode) return 'Pincode is required';
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) return 'Enter a valid 6-digit pincode';
    return '';
  };

  const validateName = (name, fieldName) => {
    if (!name) return `${fieldName} is required`;
    if (name.length < 1) return `${fieldName} must be at least 2 characters`;
    if (name.length > 50) return `${fieldName} must be less than 50 characters`;
    if (!/^[a-zA-Z\s]*$/.test(name)) return `${fieldName} should only contain letters`;
    return '';
  };

  const validateAddress = (address, fieldName) => {
    if (!address) return `${fieldName} is required`;
    if (address.length < 5) return `${fieldName} must be at least 5 characters`;
    if (address.length > 200) return `${fieldName} must be less than 200 characters`;
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'first_name':
        return validateName(value, 'First name');
      case 'last_name':
        return validateName(value, 'Last name');
      case 'mobile_number':
        return validateMobileNumber(value);
      case 'date_of_birth':
        return validateDateOfBirth(value);
      case 'email_id':
        return validateEmail(value);
      case 'aadhar_number':
        return validateAadhar(value);
      case 'father_name':
        return validateName(value, 'Father name');
      case 'father_mobile':
        return validateMobileNumber(value);
      case 'mother_name':
        return validateName(value, 'Mother name');
      case 'mother_mobile':
        return value ? validateMobileNumber(value) : ''; // Optional field
      case 'address_line1':
        return validateAddress(value, 'Address line 1');
      case 'address_line2':
        return value ? validateAddress(value, 'Address line 2') : '';
      case 'city':
        return validateName(value, 'City/District');
      case 'pincode':
        return validatePincode(value);
      case 'tenth_marks_percentage':
        return validatePercentage(value, '10th percentage');
      case 'twelfth_marks_percentage':
        return validatePercentage(value, '12th percentage');
      case 'gender':
        if (!value) return 'Gender is required';
        return '';
      case 'community':
        if (!value) return 'Community is required';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    let value = formData[fieldName];

    if (fieldName === 'aadhar_number') {
      value = value.replace(/\s/g, '');
    }

    const error = validateField(fieldName, value);
    if (error) {
      setValidationErrors({ ...validationErrors, [fieldName]: error });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldName];
      setValidationErrors(newErrors);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    let formattedValue = value;

    // Apply formatting based on field type
    if (name === 'aadhar_number') {
      formattedValue = formatAadhar(value);
    } else if (name === 'mobile_number' || name === 'father_mobile' || name === 'mother_mobile') {
      formattedValue = formatMobile(value);
    } else if (name === 'tenth_marks_percentage' || name === 'twelfth_marks_percentage') {
      formattedValue = formatPercentage(value);
    } else if (name === 'pincode') {
      formattedValue = formatPincode(value);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    // Real-time validation
    if (touched[name]) {
      let validationValue = formattedValue;
      if (name === 'aadhar_number') {
        validationValue = formattedValue.replace(/\s/g, '');
      }
      const error = validateField(name, validationValue);
      if (error) {
        setValidationErrors({ ...validationErrors, [name]: error });
      } else {
        const newErrors = { ...validationErrors };
        delete newErrors[name];
        setValidationErrors(newErrors);
      }
    }
  };

  // Fetch colleges on mount
  useEffect(() => {
    const fetchCollegesData = async () => {
      try {
        const data = await getColleges();
        const collegesArray = Array.isArray(data) ? data : data.results || [];
        setColleges(collegesArray);
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }
    };
    fetchCollegesData();
  }, []);

  // Load categories when college changes
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedCollege) {
        setCategories([]);
        setSelectedCategory('');
        setDegreeTypes([]);
        setSelectedDegreeType('');
        setCourses([]);
        setSelectedCourse('');
        return;
      }

      setLoadingFields(prev => ({ ...prev, categories: true }));
      try {
        const response = await getCollegeCategories(selectedCollege);
        if (response.success && response.categories) {
          const uniqueCategories = response.categories.filter((cat, index, self) =>
            index === self.findIndex(c => c.code === cat.code)
          );
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoadingFields(prev => ({ ...prev, categories: false }));
      }
    };
    loadCategories();
  }, [selectedCollege]);

  // Load degree types when category changes
  useEffect(() => {
    const loadDegreeTypes = async () => {
      if (!selectedCollege || !selectedCategory) {
        setDegreeTypes([]);
        setSelectedDegreeType('');
        setCourses([]);
        setSelectedCourse('');
        return;
      }

      setLoadingFields(prev => ({ ...prev, degreeTypes: true }));
      try {
        const response = await getCategoryDegreeTypes(selectedCollege, selectedCategory);
        if (response.success && response.degree_types) {
          const uniqueDegreeTypes = response.degree_types.filter((deg, index, self) =>
            index === self.findIndex(d => d.code === deg.code)
          );
          setDegreeTypes(uniqueDegreeTypes);
        }
      } catch (err) {
        console.error('Error loading degree types:', err);
      } finally {
        setLoadingFields(prev => ({ ...prev, degreeTypes: false }));
      }
    };
    loadDegreeTypes();
  }, [selectedCollege, selectedCategory]);

  // Load courses when degree type changes.
  // Uses resolveCourseId() so it works whether the API returns `id` or `course_id`.
  // Preserves the current selection only if it still exists in the fresh list.
  useEffect(() => {
    const loadCourses = async () => {
      if (!selectedCollege || !selectedCategory || !selectedDegreeType) {
        setCourses([]);
        setSelectedCourse('');
        return;
      }

      setLoadingFields(prev => ({ ...prev, courses: true }));
      try {
        const response = await getDegreeCourses(selectedCollege, selectedCategory, selectedDegreeType);
        if (response.success && response.courses) {
          const uniqueCourses = response.courses.filter((course, index, self) => {
            const id = resolveCourseId(course);
            return id !== null && index === self.findIndex(c => resolveCourseId(c) === id);
          });
          setCourses(uniqueCourses);

          setSelectedCourse(prev => {
            if (!prev) return prev;
            const stillExists = uniqueCourses.some(
              c => String(resolveCourseId(c)) === String(prev)
            );
            return stillExists ? prev : '';
          });
        }
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoadingFields(prev => ({ ...prev, courses: false }));
      }
    };
    loadCourses();
  }, [selectedCollege, selectedCategory, selectedDegreeType]);

  // Update course details when selected
  useEffect(() => {
    if (selectedCourse && courses.length > 0) {
      const course = courses.find(c => String(resolveCourseId(c)) === String(selectedCourse));
      if (course) {
        setSelectedCourseName(course.course_name);
        setSelectedDepartment(course.course_code_display || course.course_code);
      }
    }
  }, [selectedCourse, courses]);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const category = categories.find(c => c.code === selectedCategory);
      if (category) setSelectedCategoryName(category.name);
    }
  }, [selectedCategory, categories]);

  useEffect(() => {
    if (selectedDegreeType && degreeTypes.length > 0) {
      const degree = degreeTypes.find(d => d.code === selectedDegreeType);
      if (degree) setSelectedDegreeTypeName(degree.name);
    }
  }, [selectedDegreeType, degreeTypes]);

  const handleCollegeChange = (e) => {
    const collegeId = parseInt(e.target.value, 10);
    setSelectedCollege(collegeId);
    const college = colleges.find(c => c.college_id === collegeId);
    setCollegeName(college?.college_name || '');
    setSelectedCategory('');
    setSelectedDegreeType('');
    setSelectedCourse('');
    setCurrentStep(2);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedDegreeType('');
    setSelectedCourse('');
    setCurrentStep(3);
  };

  const handleDegreeTypeChange = (e) => {
    setSelectedDegreeType(e.target.value);
    setSelectedCourse('');
    setCurrentStep(4);
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setCurrentStep(5);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/', {
      state: { successMessage: 'Application submitted successfully!' },
    });
  };

  // Validate all form fields before submission
  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'first_name', 'last_name', 'mobile_number', 'date_of_birth', 'email_id',
      'aadhar_number', 'father_name', 'father_mobile', 'mother_name',
      'address_line1', 'city', 'pincode', 'gender', 'community',
      'tenth_marks_percentage', 'twelfth_marks_percentage'
    ];

    requiredFields.forEach(field => {
      let value = formData[field];
      if (field === 'aadhar_number') {
        value = value.replace(/\s/g, '');
      }
      const error = validateField(field, value);
      if (error) errors[field] = error;
    });

    if (formData.mother_mobile) {
      const error = validateField('mother_mobile', formData.mother_mobile);
      if (error) errors.mother_mobile = error;
    }

    if (formData.address_line2) {
      const error = validateField('address_line2', formData.address_line2);
      if (error) errors.address_line2 = error;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Mark all fields as touched
    const allFields = { ...touched };
    Object.keys(formData).forEach(field => { allFields[field] = true; });
    setTouched(allFields);

    // Guard against missing course selections first
    if (!selectedCollege) {
      setError('Please select a college.');
      return;
    }
    if (!selectedCategory) {
      setError('Please select a category.');
      return;
    }
    if (!selectedDegreeType) {
      setError('Please select a degree type.');
      return;
    }
    if (!isValidCourseValue(selectedCourse)) {
      setError('Please select a course.');
      return;
    }

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors before submitting');
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Numeric guards — prevent NaN / invalid IDs from ever reaching the API.
    const parsedCollegeId = parseInt(selectedCollege, 10);
    const parsedCourseId = parseInt(selectedCourse, 10);

    if (Number.isNaN(parsedCollegeId)) {
      setError('Please select a valid college before submitting');
      setLoading(false);
      return;
    }

    if (Number.isNaN(parsedCourseId)) {
      setError('Please select a valid course before submitting');
      setLoading(false);
      return;
    }

    const submitData = {
      first_name: formData.first_name,
      last_name: formData.last_name || '',
      mobile_number: formData.mobile_number,
      date_of_birth: formData.date_of_birth,
      email_id: formData.email_id,
      aadhar_number: formData.aadhar_number.replace(/\s/g, '') || '',
      father_name: formData.father_name || '',
      father_mobile: formData.father_mobile || '',
      mother_name: formData.mother_name || '',
      mother_mobile: formData.mother_mobile || '',
      address_line1: formData.address_line1 || '',
      address_line2: formData.address_line2 || '',
      city: formData.city,
      pincode: formData.pincode,
      course_name: selectedCourseName,
      department_name: selectedDepartment,
      college_id: parsedCollegeId,
      college: parsedCollegeId,
      selected_course_id: parsedCourseId,
      selected_category: selectedCategory,
      selected_degree_type: selectedDegreeType,
      gender: formData.gender,
      community: formData.community,
      blood_group: formData.blood_group || '',
      tenth_marks_percentage: formData.tenth_marks_percentage ? parseFloat(formData.tenth_marks_percentage) : null,
      twelfth_marks_percentage: formData.twelfth_marks_percentage ? parseFloat(formData.twelfth_marks_percentage) : null,
      has_diploma: false,
      has_ug: false,
      reference_name: formData.reference_name || '',
    };

    try {
      const result = await submitApplication(submitData);
      if (result.success) {
        setShowSuccessModal(true);
        setCountdown(5);
        setFormData({
          first_name: '',
          last_name: '',
          mobile_number: '',
          date_of_birth: '',
          email_id: '',
          aadhar_number: '',
          father_name: '',
          father_mobile: '',
          mother_name: '',
          mother_mobile: '',
          address_line1: '',
          address_line2: '',
          city: '',
          pincode: '',
          gender: '',
          community: '',
          blood_group: '',
          tenth_marks_percentage: '',
          twelfth_marks_percentage: '',
          reference_name: '',
        });
        setValidationErrors({});
        setTouched({});
      } else {
        setError(result.error || 'Failed to submit application');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown and redirect to home page
  useEffect(() => {
    let timer;
    let countdownInterval;

    if (showSuccessModal) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timer = setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/', {
          state: { successMessage: 'Application submitted successfully!' },
        });
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [showSuccessModal, navigate]);

  const isSelectionComplete =
    selectedCollege &&
    selectedCategory &&
    selectedDegreeType &&
    isValidCourseValue(selectedCourse);

  const steps = [
    { number: 1, title: 'College', icon: <FaUniversity />, isComplete: !!selectedCollege },
    { number: 2, title: 'Category', icon: <FaBookOpen />, isComplete: !!selectedCategory },
    { number: 3, title: 'Degree', icon: <FaGraduationCap />, isComplete: !!selectedDegreeType },
    { number: 4, title: 'Course', icon: <FaUserGraduate />, isComplete: isValidCourseValue(selectedCourse) },
  ];

  // Helper function to render input with validation
  const renderInput = (label, name, type = "text", required = true, placeholder = "", options = null, customProps = {}) => {
    const hasError = validationErrors[name] && touched[name];
    const isOptional = name === 'mother_mobile' || name === 'address_line2';

    return (
      <div className={`input-group ${hasError ? 'has-error' : ''}`}>
        <label>
          {label} {required && !isOptional && <span className="required-star">*</span>}
          {!required && <span className="optional-badge">Optional</span>}
        </label>
        {options ? (
          <select
            name={name}
            value={formData[name]}
            onChange={handleFormChange}
            onBlur={() => handleBlur(name)}
            required={required && !isOptional}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleFormChange}
            onBlur={() => handleBlur(name)}
            placeholder={placeholder}
            required={required && !isOptional}
            {...customProps}
          />
        )}
        {name === 'pincode' && formData[name] && (
          <small className="character-counter">
            {formData[name].length}/6 digits
          </small>
        )}
        {hasError && (
          <div className="error-message">
            <FaExclamationCircle /> {validationErrors[name]}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="app-shell-modern">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay" onClick={handleCloseModal}>
          <div className="success-modal-modern" onClick={(e) => e.stopPropagation()}>
            <button className="success-modal-close" onClick={handleCloseModal}>×</button>
            <SuccessIconWithBurst />
            <h3>Application Submitted Successfully!</h3>
            <p>We will reach you soon. Thank you for choosing <span className='brand-name-modern'>Vamshi Educare</span></p>
            <p className="redirect-note">
              Redirecting to <strong>Home Page</strong> in <span className="countdown">{countdown}</span> second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>
      )}

      {!showSuccessModal && (
        <div className="form-container-modern">
          <div className="form-header-modern">
            <div className="logo-section">
              <img src="/Logo.png" alt="Logo" className="logo-modern" />
              <div className="brand-section">
                <span className="brand-name-modern">VAMSHI EDUCARE</span>
                <span className="brand-tagline">Career Guidance Center</span>
              </div>
            </div>
            <h1>Scholarship Form</h1>
            <p>Fill in the details to apply for your desired course</p>
          </div>

          <div className="progress-steps">
            {steps.map((step, index) => (
              <div key={step.number} className={`step-item ${step.isComplete ? 'completed' : ''} ${currentStep === step.number ? 'active' : ''}`}>
                <div className="step-circle">
                  {step.isComplete ? <FaCheckCircle /> : step.number}
                </div>
                <div className="step-label">{step.title}</div>
                {index < steps.length - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="form-modern" noValidate>
            {/* Course Selection Section */}
            <div className="card-modern">
              <div className="card-title"><FaGraduationCap /> Course Selection</div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Select College *</label>
                  <select value={selectedCollege} onChange={handleCollegeChange}>
                    <option value="">-- Choose College --</option>
                    {colleges.map((college, index) => (
                      <option key={`college-${college.college_id}-${index}`} value={college.college_id}>
                        {college.location_city} - {college.college_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Select Category *</label>
                  <select value={selectedCategory} onChange={handleCategoryChange} disabled={!selectedCollege || loadingFields.categories}>
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat, index) => (
                      <option key={`category-${cat.code}-${index}`} value={cat.code}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Select Degree Type *</label>
                  <select value={selectedDegreeType} onChange={handleDegreeTypeChange} disabled={!selectedCategory || loadingFields.degreeTypes}>
                    <option value="">-- Choose Degree Type --</option>
                    {degreeTypes.map((deg, index) => (
                      <option key={`degree-${deg.code}-${index}`} value={deg.code}>
                        {deg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Select Course *</label>
                  <select
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    disabled={!selectedDegreeType || loadingFields.courses}
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map((course, index) => {
                      const cid = resolveCourseId(course);
                      if (cid === null) return null;
                      return (
                        <option key={`course-${cid}-${index}`} value={String(cid)}>
                          {course.course_name} ({course.course_code})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {isSelectionComplete && (
                <div className="selection-summary-modern">
                  <div className="summary-title">Selected Course Summary</div>
                  <div className="summary-grid">
                    <div><strong>College:</strong> {collegeName}</div>
                    <div><strong>Category:</strong> {selectedCategoryName}</div>
                    <div><strong>Degree Type:</strong> {selectedDegreeTypeName}</div>
                    <div><strong>Course:</strong> {selectedCourseName}</div>
                  </div>
                </div>
              )}

              <div className="input-group full-width">
                <label>Reference Name</label>
                <input type="text" name="reference_name" value={formData.reference_name || ''} onChange={handleFormChange} placeholder="Enter reference name" />
                <small className="field-hint">Who referred you to this college? (Optional)</small>
              </div>
            </div>

            {/* Personal Details Section */}
            {isSelectionComplete && (
              <>
                <div className="card-modern">
                  <div className="card-title"><FaUserGraduate /> Personal Details</div>
                  <div className="form-grid-2">
                    {renderInput('First Name', 'first_name', 'text', true, 'Enter first name')}
                    {renderInput('Last Name', 'last_name', 'text', true, 'Enter last name')}
                    {renderInput('Mobile Number', 'mobile_number', 'tel', true, '10-digit mobile number')}
                    {renderInput('Date of Birth', 'date_of_birth', 'date', true, 'YYYY-MM-DD', null, {
                      max: dateLimits.max,
                      min: dateLimits.min
                    })}
                    {renderInput('Email ID', 'email_id', 'email', true, 'example@domain.com')}
                    {renderInput('Aadhar Number', 'aadhar_number', 'text', true, 'XXXX XXXX XXXX')}

                    <div className="input-group">
                      <label>Gender *</label>
                      <select name="gender" value={formData.gender} onChange={handleFormChange} onBlur={() => handleBlur('gender')} required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {validationErrors.gender && touched.gender && (
                        <div className="error-message"><FaExclamationCircle /> {validationErrors.gender}</div>
                      )}
                    </div>

                    <div className="input-group">
                      <label>Community *</label>
                      <select name="community" value={formData.community} onChange={handleFormChange} onBlur={() => handleBlur('community')} required>
                        <option value="">Select Community</option>
                        <option value="OC">OC</option>
                        <option value="BC">BC</option>
                        <option value="MBC">MBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="SCA">SCA</option>
                        <option value="BCM">BCM</option>
                        <option value="DNC">DNC</option>
                      </select>
                      {validationErrors.community && touched.community && (
                        <div className="error-message"><FaExclamationCircle /> {validationErrors.community}</div>
                      )}
                    </div>

                    <div className="input-group">
                      <label>Blood Group</label>
                      <select name="blood_group" value={formData.blood_group} onChange={handleFormChange}>
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card-modern">
                  <div className="card-title"><FaUsers /> Parent Details</div>
                  <div className="form-grid-2">
                    {renderInput('Father Name', 'father_name', 'text', true, "Enter father's name")}
                    {renderInput('Father Mobile', 'father_mobile', 'tel', true, "10-digit mobile number")}
                    {renderInput('Mother Name', 'mother_name', 'text', true, "Enter mother's name")}
                    {renderInput('Mother Mobile', 'mother_mobile', 'tel', false, "10-digit mobile number (Optional)")}
                  </div>
                </div>

                <div className="card-modern">
                  <div className="card-title"><FaGraduationCap /> Education Details</div>
                  <div className="form-grid-2">
                    {renderInput('10th Percentage', 'tenth_marks_percentage', 'text', true, 'Enter percentage (0-100)')}
                    {renderInput('12th Percentage', 'twelfth_marks_percentage', 'text', true, 'Enter percentage (0-100)')}
                    <div className="full-width">
                      <small className="input-small">Note: If result not declared, enter 0 as percentage.</small>
                    </div>
                  </div>
                </div>

                <div className="card-modern">
                  <div className="card-title"><FaMapMarkerAlt /> Address Details</div>
                  <div className="form-grid-2">
                    {renderInput('Address Line 1', 'address_line1', 'text', true, 'Street/House name')}
                    {renderInput('Address Line 2', 'address_line2', 'text', false, 'Area/Locality (Optional)')}
                    {renderInput('City/District', 'city', 'text', true, 'Enter city or district name')}
                    {renderInput('Pincode', 'pincode', 'text', true, 'Enter 6-digit pincode', null, { maxLength: 6 })}
                  </div>
                </div>
              </>
            )}

            {error && <div className="error-message-modern">{error}</div>}

            <button type="submit" className="submit-btn-modern" disabled={loading || !isSelectionComplete}>
              {loading ? 'Submitting...' : 'Submit Application'} <FaArrowRight />
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default ApplicationForm;