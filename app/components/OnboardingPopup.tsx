'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import styles from './OnboardingPopup.module.css';

// Constants for predefined options
const predefinedRoles = [
  "Founder", "C-level", "BD", "Community Manager", "Collab Manager",
  "Outreach Team", "KOL", "Ambassador", "Content Creator", "Alpha Caller",
  "Venture Capital", "Developer", "Designer", "Advisor"
];

const predefinedNiches = [
  "DeFi", "Gaming", "NFT", "Social", "Infrastructure", "DAO", "AI",
  "RWA", "DePin", "L1/L2/L3", "Data", "IP", "Web2 Brand entering Web3",
  "Exchange", "Market Maker"
];

const contentTypes = ["Thread Writing", "Video Content", "Technical Content", "Educational Content"];
const contentPlatforms = ["Twitter", "YouTube", "LinkedIn", "Medium", "TikTok", "Instagram"];
const roundTypes = ["Pre-seed", "Seed", "Private", "Strategic", "Public"];
const ticketSizes = [">$5k", "5k-10k", "10k-25k", "25k-100k", "100k-250k", "250k-500k", "1mil+"];
const FDV = ["<$5mil", "$5mil-$10mil", "$10mil-$20mil", "$20mil-$50mil", "$50mil-$100mil", "$100mil-$200mil", "$200mil+"];

interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  primary_city: string;
  secondary_city: string[];
  roles: string[];
  projects: {
    name: string;
    role: string;
    twitter: string;
    website: string;
    niches: string[];
    image: any;
  }[];
  isContentCreator: boolean | number;
  contentCreatorDescription: string;
  contentPlatforms: string[];
  contentTypes: string[];
  platformLinks: Record<string, string>;
  FDV: string[];
  criterias: string[];
  equityOrToken: string;
  investmentProfile: {
    isInvestor: string;
    roundTypes: string[];
    ticketSize: string[];
  };
  bio: string;
  short_bio: string;
  extensive_bio: string;
  onboarding_steps: number;
  onboarding_completed?: boolean;
}

interface FormErrors {
  firstname?: string;
  lastname?: string;
  email?: string;
  primary_city?: string;
}

interface DynamicUser {
  id?: string;
  email?: string;
  verifiedCredentials?: any[];
}

export default function OnboardingPopup({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useDynamicContext() as { user: DynamicUser | null, isAuthenticated: boolean };
  
  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    lastname: '',
    email: user?.email || '',
    primary_city: '',
    secondary_city: [],
    roles: [],
    projects: [
      {
        name: '',
        role: '',
        twitter: '',
        website: '',
        niches: [],
        image: null,
      },
    ],
    isContentCreator: false,
    contentCreatorDescription: '',
    contentPlatforms: [],
    contentTypes: [],
    platformLinks: {},
    FDV: [],
    criterias: [],
    equityOrToken: '',
    investmentProfile: {
      isInvestor: 'never',
      roundTypes: [],
      ticketSize: [],
    },
    bio: '',
    short_bio: '',
    extensive_bio: '',
    onboarding_steps: 1,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Add logging for user context
  useEffect(() => {
    console.log('Dynamic user:', user);
    console.log('Is authenticated:', isAuthenticated);
  }, [user, isAuthenticated]);

  // Load user data if exists
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.email) {
          const response = await fetch(`/api/user?email=${user.email}`);
          if (response.ok) {
            const userData = await response.json();
            setFormData(prev => ({
              ...prev,
              ...userData,
              email: user.email || userData.email || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  // Save data to MongoDB
  const saveData = async (data: Partial<FormData>) => {
    try {
      if (!user?.email) {
        throw new Error('No email available');
      }

      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          ...data,
          onboarding_step: formData.onboarding_steps,
          onboarding_completed: formData.onboarding_steps === 6,
        }),
      });

      const responseData = await response.json();
      console.log('Save response:', responseData);

      if (!response.ok) {
        throw new Error(`Failed to save data: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!formData.firstname.trim()) {
      errors.firstname = 'First name is required';
    }
    
    if (!formData.lastname.trim()) {
      errors.lastname = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.primary_city.trim()) {
      errors.primary_city = 'Primary city is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = async () => {
    if (formData.onboarding_steps === 1) {
      if (!validateForm()) {
        return;
      }
      // Save basic profile data
      await saveData({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        primary_city: formData.primary_city,
        secondary_city: formData.secondary_city,
      });
    } else if (formData.onboarding_steps === 2) {
      // Save roles
      await saveData({
        roles: formData.roles,
      });
    } else if (formData.onboarding_steps === 3) {
      // Save projects
      await saveData({
        projects: formData.projects,
      });
    } else if (formData.onboarding_steps === 4) {
      // Save content creator info
      await saveData({
        isContentCreator: formData.isContentCreator,
        contentCreatorDescription: formData.contentCreatorDescription,
        contentPlatforms: formData.contentPlatforms,
        contentTypes: formData.contentTypes,
        platformLinks: formData.platformLinks,
      });
    } else if (formData.onboarding_steps === 5) {
      // Save investment profile
      await saveData({
        investmentProfile: formData.investmentProfile,
        FDV: formData.FDV,
        criterias: formData.criterias,
        equityOrToken: formData.equityOrToken,
      });
    }

    setFormData(prev => ({ ...prev, onboarding_steps: prev.onboarding_steps + 1 }));
  };

  const handleSubmit = async () => {
    // Save final bio data
    await saveData({
      bio: formData.bio,
      short_bio: formData.short_bio,
      extensive_bio: formData.extensive_bio,
      onboarding_completed: true,
    });
    onClose();
  };

  const [customRole, setCustomRole] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [secondaryCity, setSecondaryCity] = useState('');

  const renderStepContent = () => {
    switch (formData.onboarding_steps) {
      case 1: {
        return (
          <div className={styles.step_content}>
            <h2>Tell us about you</h2>
            <p>Basic profile information</p>
            <div className={styles.form_group}>
              <div className={styles.grid}>
                <div>
                  <input
                    type="text"
                    placeholder="First Name*"
                    value={formData.firstname}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, firstname: e.target.value}));
                      if (formErrors.firstname) {
                        setFormErrors(prev => ({ ...prev, firstname: undefined }));
                      }
                    }}
                    className={`${styles.form_input} ${formErrors.firstname ? styles.error : ''}`}
                  />
                  {formErrors.firstname && (
                    <div className={styles.error_message}>{formErrors.firstname}</div>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last Name*"
                    value={formData.lastname}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, lastname: e.target.value}));
                      if (formErrors.lastname) {
                        setFormErrors(prev => ({ ...prev, lastname: undefined }));
                      }
                    }}
                    className={`${styles.form_input} ${formErrors.lastname ? styles.error : ''}`}
                  />
                  {formErrors.lastname && (
                    <div className={styles.error_message}>{formErrors.lastname}</div>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email*"
                  value={formData.email}
                  disabled
                  className={`${styles.form_input} ${formErrors.email ? styles.error : ''}`}
                />
                {formErrors.email && (
                  <div className={styles.error_message}>{formErrors.email}</div>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Primary City*"
                  value={formData.primary_city}
                  onChange={(e) => {
                    setFormData(prev => ({...prev, primary_city: e.target.value}));
                    if (formErrors.primary_city) {
                      setFormErrors(prev => ({ ...prev, primary_city: undefined }));
                    }
                  }}
                  className={`${styles.form_input} ${formErrors.primary_city ? styles.error : ''}`}
                />
                {formErrors.primary_city && (
                  <div className={styles.error_message}>{formErrors.primary_city}</div>
                )}
              </div>
              <div className={styles.secondary_input_group}>
                <input
                  type="text"
                  placeholder="Secondary City"
                  value={secondaryCity}
                  onChange={(e) => setSecondaryCity(e.target.value)}
                  className={styles.form_input}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && secondaryCity.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        secondary_city: [...prev.secondary_city, secondaryCity.trim()]
                      }));
                      setSecondaryCity('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (secondaryCity.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        secondary_city: [...prev.secondary_city, secondaryCity.trim()]
                      }));
                      setSecondaryCity('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
              {formData.secondary_city.length > 0 && (
                <div className={styles.flex_wrap}>
                  {formData.secondary_city.map((city, index) => (
                    <div key={index} className={styles.city_tag}>
                      <span>{city}</span>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            secondary_city: prev.secondary_city.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 2: {
        return (
          <div className={styles.step_content}>
            <h2>You are a...</h2>
            <div className={styles.space_y_6}>
              <div className={styles.flex_wrap}>
                {predefinedRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        roles: prev.roles.includes(role)
                          ? prev.roles.filter(r => r !== role)
                          : [...prev.roles, role]
                      }));
                    }}
                    className={formData.roles.includes(role) ? styles.role_active : styles.role}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className={styles.custom_input}>
                <input
                  type="text"
                  placeholder="Add custom role"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className={styles.form_input}
                />
                <button
                  onClick={() => {
                    if (customRole.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        roles: [...prev.roles, customRole.trim()]
                      }));
                      setCustomRole('');
                    }
                  }}
                  disabled={!customRole.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        );
      }

      case 3: {
        return (
          <div className={styles.step_content}>
            <h2>Which project do you represent?</h2>
            {formData.projects.map((project, index) => (
              <div key={index} className={styles.project_container}>
                <div className={styles.project_header}>
                  <h3>Project {index + 1}</h3>
                  {index > 0 && (
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          projects: prev.projects.filter((_, i) => i !== index)
                        }));
                      }}
                      className={styles.remove_button}
                    >
                      Remove Project
                    </button>
                  )}
                </div>

                <div className={styles.project_form}>
                  <input
                    type="text"
                    placeholder="Project Name*"
                    value={project.name}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />
                  <input
                    type="text"
                    placeholder="Your Role in Project*"
                    value={project.role}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].role = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />
                  <input
                    type="text"
                    placeholder="Twitter Link*"
                    value={project.twitter}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].twitter = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />
                  <input
                    type="text"
                    placeholder="Official Website*"
                    value={project.website}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].website = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />

                  <div className={styles.niches_section}>
                    <h4>Project Niches</h4>
                    <div className={styles.niches_grid}>
                      {predefinedNiches.map((niche) => (
                        <button
                          key={niche}
                          onClick={() => {
                            const updatedProjects = [...formData.projects];
                            updatedProjects[index].niches = project.niches.includes(niche)
                              ? project.niches.filter(n => n !== niche)
                              : [...project.niches, niche];
                            setFormData(prev => ({ ...prev, projects: updatedProjects }));
                          }}
                          className={project.niches.includes(niche) ? styles.niche_active : styles.niche}
                        >
                          {niche}
                        </button>
                      ))}
                    </div>

                    <div className={styles.custom_input}>
                      <input
                        type="text"
                        placeholder="Add custom niche"
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        className={styles.form_input}
                      />
                      <button
                        onClick={() => {
                          if (customNiche.trim()) {
                            const updatedProjects = [...formData.projects];
                            updatedProjects[index].niches = [...project.niches, customNiche.trim()];
                            setFormData(prev => ({ ...prev, projects: updatedProjects }));
                            setCustomNiche('');
                          }
                        }}
                        disabled={!customNiche.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  projects: [...prev.projects, {
                    name: '',
                    role: '',
                    twitter: '',
                    website: '',
                    niches: [],
                    image: null,
                  }]
                }));
              }}
              className={styles.add_project_button}
            >
              + Add Another Project
            </button>
          </div>
        );
      }

      case 4: {
        return (
          <div className={styles.step_content}>
            <h2>Content Creation</h2>
            <p>Are you interested in being an Ambassador for projects you like?</p>

            <div className={styles.radio_group}>
              <label className={styles.radio_label}>
                <input
                  type="radio"
                  checked={formData.isContentCreator === 1}
                  onChange={() => setFormData(prev => ({ ...prev, isContentCreator: 1 }))}
                  className={styles.radio_input}
                />
                <span>Yes, I create content</span>
              </label>

              <label className={styles.radio_label}>
                <input
                  type="radio"
                  checked={formData.isContentCreator === 2}
                  onChange={() => setFormData(prev => ({ ...prev, isContentCreator: 2 }))}
                  className={styles.radio_input}
                />
                <span>It's not my main focus, but open to tweet about projects I really like</span>
              </label>

              <label className={styles.radio_label}>
                <input
                  type="radio"
                  checked={formData.isContentCreator === 3}
                  onChange={() => setFormData(prev => ({ ...prev, isContentCreator: 3 }))}
                  className={styles.radio_input}
                />
                <span>I never do any type of content (completely behind the scenes)</span>
              </label>
            </div>

            {[1, 2].includes(Number(formData.isContentCreator)) && (
              <div className={styles.content_options}>
                <div className={styles.section}>
                  <h3>Select Platforms</h3>
                  <div className={styles.platforms_grid}>
                    {contentPlatforms.map((platform) => (
                      <div key={platform} className={styles.platform_container}>
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              contentPlatforms: prev.contentPlatforms.includes(platform)
                                ? prev.contentPlatforms.filter(p => p !== platform)
                                : [...prev.contentPlatforms, platform],
                              platformLinks: {
                                ...prev.platformLinks,
                                [platform]: prev.platformLinks[platform] || ''
                              }
                            }));
                          }}
                          className={formData.contentPlatforms.includes(platform) 
                            ? styles.platform_active 
                            : styles.platform}
                        >
                          {platform}
                        </button>
                        {formData.contentPlatforms.includes(platform) && (
                          <input
                            type="text"
                            placeholder={`Enter your ${platform} profile URL`}
                            value={formData.platformLinks[platform] || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                platformLinks: {
                                  ...prev.platformLinks,
                                  [platform]: e.target.value
                                }
                              }));
                            }}
                            className={styles.form_input}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Content Types</h3>
                  <div className={styles.content_types_grid}>
                    {contentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            contentTypes: prev.contentTypes.includes(type)
                              ? prev.contentTypes.filter(t => t !== type)
                              : [...prev.contentTypes, type]
                          }));
                        }}
                        className={formData.contentTypes.includes(type) 
                          ? styles.content_type_active 
                          : styles.content_type}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>About Your Content</h3>
                  <textarea
                    placeholder="Describe yourself as a content creator..."
                    value={formData.contentCreatorDescription}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contentCreatorDescription: e.target.value 
                    }))}
                    className={styles.content_textarea}
                  />
                </div>
              </div>
            )}
          </div>
        );
      }

      case 5: {
        return (
          <div className={styles.step_content}>
            <h2>Investment Profile</h2>
            <p>Do you invest in projects?</p>

            <div className={styles.radio_group}>
              {["Yes", "Sometimes", "Never"].map((option) => (
                <label key={option} className={styles.radio_label}>
                  <input
                    type="radio"
                    checked={formData.investmentProfile.isInvestor === option.toLowerCase()}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        investmentProfile: {
                          ...prev.investmentProfile,
                          isInvestor: option.toLowerCase()
                        }
                      }));
                    }}
                    className={styles.radio_input}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {formData.investmentProfile.isInvestor !== 'never' && (
              <div className={styles.investment_options}>
                <div className={styles.section}>
                  <h3>Preferred Round Types</h3>
                  <div className={styles.options_grid}>
                    {roundTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            investmentProfile: {
                              ...prev.investmentProfile,
                              roundTypes: prev.investmentProfile.roundTypes.includes(type)
                                ? prev.investmentProfile.roundTypes.filter(t => t !== type)
                                : [...prev.investmentProfile.roundTypes, type]
                            }
                          }));
                        }}
                        className={formData.investmentProfile.roundTypes.includes(type) 
                          ? styles.option_active 
                          : styles.option}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Average ticket size</h3>
                  <div className={styles.options_grid}>
                    {ticketSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            investmentProfile: {
                              ...prev.investmentProfile,
                              ticketSize: prev.investmentProfile.ticketSize.includes(size)
                                ? prev.investmentProfile.ticketSize.filter(s => s !== size)
                                : [...prev.investmentProfile.ticketSize, size]
                            }
                          }));
                        }}
                        className={formData.investmentProfile.ticketSize.includes(size) 
                          ? styles.option_active 
                          : styles.option}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Preferred FDV</h3>
                  <div className={styles.options_grid}>
                    {FDV.map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            FDV: prev.FDV.includes(value)
                              ? prev.FDV.filter(v => v !== value)
                              : [...prev.FDV, value]
                          }));
                        }}
                        className={formData.FDV.includes(value) 
                          ? styles.option_active 
                          : styles.option}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 6: {
        return (
          <div className={styles.step_content}>
            <h2 className={styles.text_2xl}>Tell us about yourself</h2>
            <div className={styles.space_y_6}>
              <div>
                <h3 className={styles.text_lg}>Short bio</h3>
                <textarea
                  placeholder="Describe yourself briefly..."
                  value={formData.short_bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_bio: e.target.value }))}
                  className={`${styles.w_full} ${styles.p_3} ${styles.border} ${styles.rounded_lg} ${styles.h_24} ${styles.resize_none}`}
                />
              </div>

              <div>
                <h3 className={styles.text_lg}>Extensive bio</h3>
                <textarea
                  placeholder="Tell us more about you. Background, your current focus and interests..."
                  value={formData.extensive_bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, extensive_bio: e.target.value }))}
                  className={`${styles.w_full} ${styles.p_3} ${styles.border} ${styles.rounded_lg} ${styles.h_48} ${styles.resize_none}`}
                />
              </div>
            </div>
          </div>
        );
      }

      default: {
        return null;
      }
    }
  };

  // Add close handler
  const handleClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.popup_overlay} onClick={handleClose}>
      <div className={styles.onboarding_popup_content} onClick={e => e.stopPropagation()}>
        <button 
          className={styles.popup_close}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className={styles.step_indicator}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={styles.step_wrapper}>
              <div 
                className={`${styles.step} ${
                  formData.onboarding_steps > i + 1 
                    ? styles.completed 
                    : formData.onboarding_steps === i + 1 
                    ? styles.active 
                    : ''
                }`}
              >
                {i + 1}
              </div>
              {i < 5 && (
                <div className={styles.step_line} />
              )}
            </div>
          ))}
        </div>

        <div className={styles.step_content}>
          {renderStepContent()}
        </div>

        <div className={styles.button_group}>
          {formData.onboarding_steps > 1 && (
            <button 
              onClick={() => setFormData(prev => ({...prev, onboarding_steps: prev.onboarding_steps - 1}))}
              className={styles.back_button}
            >
              Back
            </button>
          )}
          {formData.onboarding_steps < 6 ? (
            <button 
              onClick={handleNextStep}
              className={styles.next_button}
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className={styles.submit_button}
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 