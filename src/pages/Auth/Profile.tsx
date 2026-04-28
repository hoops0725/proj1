import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AuthLayout } from '../../components/ui/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { countries, getCitiesByCountry } from '../../data/locationData';

// 从环境变量获取 API Key，不提供默认值
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

if (!IMGBB_API_KEY) {
  console.error('imgbb API Key 未配置，请设置 VITE_IMGBB_API_KEY 环境变量');
}

const Profile: React.FC = () => {
  const { user, updateProfile, loading, error, getProfile } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    country: user?.country || '',
    city: user?.city || '',
    website: user?.website || '',
    preferred_language: user?.preferred_language || 'zh',
    theme: user?.theme || 'light',
    avatar_url: user?.avatar_url || ''
  });
  
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const availableCities = profileData.country ? getCitiesByCountry(profileData.country) : [];
  
  useEffect(() => {
    const loadProfile = async () => {
      await getProfile();
    };
    loadProfile();
  }, []);
  
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        bio: user.bio || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        website: user.website || '',
        preferred_language: user.preferred_language || 'zh',
        theme: user.theme || 'light',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);
  
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!profileData.full_name) {
      errors.full_name = '请输入姓名';
    }
    
    if (!profileData.email) {
      errors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await updateProfile(profileData);
      setSuccessMessage('个人资料更新成功！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // 错误处理已在 authStore 中处理
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'country') {
      setProfileData(prev => ({ ...prev, [name]: value, city: '' }));
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('选择的文件:', file.name, '大小:', file.size, '类型:', file.type);
    
    if (file.size > 32 * 1024 * 1024) {
      setSuccessMessage('文件大小不能超过 32MB');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const apiUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
      console.log('开始上传头像...');
      console.log('API URL:', apiUrl);
      console.log('文件信息:', { name: file.name, size: file.size, type: file.type });
      console.log('API Key:', IMGBB_API_KEY);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('响应状态:', response.status, response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('响应文本:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('解析 JSON 失败:', parseError);
        throw new Error('服务器响应格式错误');
      }
      
      console.log('API 返回数据:', data);
      
      if (data.success && data.data && data.data.url) {
        console.log('头像 URL:', data.data.url);
        setProfileData(prev => ({ ...prev, avatar_url: data.data.url }));
        setSuccessMessage('头像上传成功！');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.error('上传失败，返回数据:', data);
        const errorCode = data.error?.code;
        let errorMsg = data.error?.message || data.error || '上传失败，请重试';
        
        if (errorCode === 100) {
          errorMsg = 'API key无效，请检查配置';
        } else if (errorCode === 101) {
          errorMsg = '图片文件无效';
        } else if (errorCode === 102) {
          errorMsg = '图片大小超过限制（最大32MB）';
        }
        
        setSuccessMessage(errorMsg);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('头像上传失败:', err);
      const errorMessage = err instanceof Error ? err.message : '上传失败，请重试';
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const removeAvatar = () => {
    setProfileData(prev => ({ ...prev, avatar_url: '' }));
  };
  
  if (!user) {
    navigate('/auth/login');
    return null;
  }
  
  return (
    <AuthLayout logoText="个人资料">
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-white/70 hover:text-white transition-colors"
            aria-label="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">个人资料</h2>
            <p className="text-sm text-white/70">管理您的账户信息</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-300">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 cursor-pointer hover:border-cyan-400 transition-colors relative"
              onClick={handleAvatarClick}
            >
              {profileData.avatar_url ? (
                <img 
                  src={profileData.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-white/70 mt-2 cursor-pointer hover:text-cyan-300 transition-colors" onClick={handleAvatarClick}>
              {isUploading ? '上传中...' : '点击更换头像'}
            </p>
            {profileData.avatar_url && (
              <button
                type="button"
                onClick={removeAvatar}
                className="text-sm text-red-400 hover:text-red-300 mt-1 transition-colors"
              >
                移除头像
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <Input
            label="全名"
            type="text"
            name="full_name"
            placeholder="您的姓名"
            value={profileData.full_name}
            onChange={handleChange}
            error={validationErrors.full_name}
            required
          />

          <Input
            label="邮箱地址"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={profileData.email}
            onChange={handleChange}
            error={validationErrors.email}
            required
            disabled
          />

          <div>
            <label className="block text-sm font-medium text-white mb-2">个人简介</label>
            <textarea
              name="bio"
              placeholder="介绍一下自己..."
              value={profileData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white resize-none"
              rows={4}
            />
          </div>

          <Input
            label="电话号码"
            type="tel"
            name="phone"
            placeholder="您的电话号码"
            value={profileData.phone}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-white mb-2">国家</label>
            <select
              name="country"
              value={profileData.country}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
            >
              <option value="">请选择国家</option>
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.nameZh} ({country.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">城市</label>
            <select
              name="city"
              value={profileData.city}
              onChange={handleChange}
              disabled={!profileData.country}
              className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                profileData.country 
                  ? 'bg-white/10 border border-white/20 text-white' 
                  : 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <option value="">请选择城市</option>
              {availableCities.map(city => (
                <option key={city.code} value={city.code}>
                  {city.nameZh} ({city.name})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="个人网站"
            type="url"
            name="website"
            placeholder="https://example.com"
            value={profileData.website}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-white mb-2">首选语言</label>
            <select
              name="preferred_language"
              value={profileData.preferred_language}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">主题</label>
            <select
              name="theme"
              value={profileData.theme}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading || isUploading}
          >
            保存更改
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Profile;