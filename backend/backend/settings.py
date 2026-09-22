import os
import dj_database_url
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env (sits next to manage.py)
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ==================== CREATE REQUIRED DIRECTORIES ====================
SAVED_APPLICATIONS_DIR = BASE_DIR / 'saved_applications'
os.makedirs(SAVED_APPLICATIONS_DIR, exist_ok=True)

# ==================== SECURITY ====================
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-&z+ca)$#0^a(l^nve5dhf0y*8c32om^-$ey#oij06cst@1cpy8')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.environ.get(
    'ALLOWED_HOSTS',
    '*,localhost,127.0.0.1,10.121.75.244,dsuvamshieducare.org,www.dsuvamshieducare.org,.vercel.app'
).split(',')

CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'https://dsuvamshieducare.org,https://www.dsuvamshieducare.org,https://*.vercel.app,http://localhost:5173,http://localhost:3000'
).split(',')

# ==================== APPLICATION DEFINITION ====================
INSTALLED_APPS = [
    'admin_interface',
    'colorfield',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'anymail',
    'backend',
    'colleges',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [str(BASE_DIR / 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ==================== DATABASE - SELF-HOSTED ON DELL/UBUNTU SERVER ====================
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    db_config = dj_database_url.parse(DATABASE_URL, conn_max_age=600, conn_health_checks=True)
    db_config['OPTIONS'] = {
        'connect_timeout': 10,
    }
    DATABASES = {
        'default': db_config
    }
    print(f"Using self-hosted PostgreSQL: {db_config.get('HOST', 'unknown')}")

    conn_max_age = os.environ.get('DB_CONN_MAX_AGE')
    if conn_max_age:
        DATABASES['default']['CONN_MAX_AGE'] = int(conn_max_age)

    try:
        from django.db import connections
        connections['default'].cursor()
        print("Database connection successful!")
    except Exception as e:
        print(f"Database connection test failed: {e}")

elif os.environ.get('DB_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'connect_timeout': 10,
            },
        }
    }
    print(f"Using self-hosted PostgreSQL via DB_* env vars: {os.environ.get('DB_HOST', 'localhost')}")

else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(BASE_DIR / 'db.sqlite3'),
        }
    }
    print("Using SQLite database for development")

# ==================== CORS SETTINGS ====================
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', str(DEBUG)).lower() == 'true'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://dsuvamshieducare.org",
    "https://www.dsuvamshieducare.org",
]

env_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if env_cors_origins:
    CORS_ALLOWED_ORIGINS.extend([origin.strip() for origin in env_cors_origins.split(',') if origin.strip()])

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://(www\.)?dsuvamshieducare\.org$",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ==================== REST FRAMEWORK ====================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# ==================== AUTHENTICATION ====================
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# ==================== PASSWORD VALIDATION ====================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ==================== INTERNATIONALIZATION ====================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ==================== STATIC & MEDIA FILES ====================
STATIC_URL = '/static/'
STATIC_ROOT = str(BASE_DIR / 'staticfiles')

STATICFILES_DIRS = [
    str(BASE_DIR / 'static'),
]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = str(BASE_DIR / 'media')

# ==================== FILE UPLOAD SETTINGS ====================
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

# ==================== SECURITY SETTINGS (Production) ====================
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    print("Using console email backend (development)")
else:
    EMAIL_BACKEND = "anymail.backends.resend.EmailBackend"
    ANYMAIL = {
        "RESEND_API_KEY": os.environ.get("RESEND_API_KEY"),
    }
    print("Using Resend email provider (production)")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")

DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'VAMSHI EDUCARE <noreply@dsuvamshieducare.org>')
SERVER_EMAIL = os.environ.get('SERVER_EMAIL', DEFAULT_FROM_EMAIL)

STAFF_NOTIFICATION_EMAIL = os.environ.get('STAFF_NOTIFICATION_EMAIL', 'gokulece303@gmail.com')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://dsuvamshieducare.org')

if not DEBUG and not RESEND_API_KEY:
    print("WARNING: RESEND_API_KEY not set! Email sending will fail.")

# ==================== LOGGING ====================
LOG_LEVEL = os.environ.get('DJANGO_LOG_LEVEL', 'INFO')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'colleges': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'backend': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# ==================== AUTO SUPERUSER CREATION ====================
if os.environ.get('DATABASE_URL') and os.environ.get('DJANGO_SUPERUSER_USERNAME'):
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()

        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Gokul@123')

        if password and not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            print(f"Superuser '{username}' created successfully!")
        elif not password:
            print("DJANGO_SUPERUSER_PASSWORD not set, skipping superuser creation")
        else:
            print(f"Superuser '{username}' already exists")
    except Exception as e:
        print(f"Could not create superuser: {e}")

# ==================== DEFAULT PRIMARY KEY FIELD ====================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

print(f"Django running in {'DEVELOPMENT' if DEBUG else 'PRODUCTION'} mode")
