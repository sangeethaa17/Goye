import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../config';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [credits, setCredits] = useState(() => {
    const isSub = localStorage.getItem('isSubscribed') === 'true';
    if (isSub) return 99999;
    const isTestingConditionActive = Date.now() <= new Date('2026-09-21T23:39:00+05:30').getTime();
    const isFreeUser = !!localStorage.getItem('freeUserToken') || !!localStorage.getItem('freeUserData');
    if (isTestingConditionActive && !isFreeUser) {
      return 0;
    }
    const stored = localStorage.getItem('credits');
    return stored !== null ? Math.max(0, parseInt(stored, 10)) : 0;
  });
  const [loading, setLoading] = useState(false);

  // Fetch notifications for the currently logged-in user
  const fetchNotifications = useCallback(async () => {
    let email = localStorage.getItem('email');
    if (!email) {
      try {
        const freeUserData = JSON.parse(localStorage.getItem('freeUserData') || '{}');
        email = freeUserData.email;
      } catch (e) {}
    }
    if (!email) return;

    try {
      setLoading(true);
      const apiBaseUrl = API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/notifications?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.notifications)) {
          // Sort newest notifications first and keep full accurate server messages
          const sorted = [...data.notifications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setNotifications(sorted);
          const unread = sorted.filter(n => !n.read).length;
          setUnreadCount(unread);

          const hasApprovalNotif = sorted.some(n => 
            n.type === 'request_approved' || 
            (n.title && (n.title.includes('Activated') || n.title.includes('Queued') || n.title.includes('Approved')))
          );
          const isFreeUserActive = !!localStorage.getItem('freeUserToken') || !!localStorage.getItem('freeUserData');
          if (!isFreeUserActive && hasApprovalNotif && localStorage.getItem('isSubscribed') !== 'true') {
            localStorage.setItem('isSubscribed', 'true');
            localStorage.setItem('credits', '99999');
            window.dispatchEvent(new Event('creditsChanged'));
            window.dispatchEvent(new Event('subscriptionActivated'));
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchNotifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current user credits balance
  const fetchCredits = useCallback(async () => {
    const email = localStorage.getItem('email');
    let freeUserId = null;
    let freeUserData = null;
    const freeUserDataStr = localStorage.getItem('freeUserData');
    if (freeUserDataStr) {
      try {
        freeUserData = JSON.parse(freeUserDataStr);
        freeUserId = freeUserData?.id;
      } catch (e) {}
    }

    if (!email && !freeUserId) return;

    try {
      const apiBaseUrl = API_BASE_URL;
      const isFreeUser = !!localStorage.getItem('freeUserToken') || !!localStorage.getItem('freeUserData');
      const response = await fetch(`${apiBaseUrl}/api/user/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id: freeUserId, isFreeUser })
      });

      if (response.ok) {
        const data = await response.json();

        if (isFreeUser) {
          const fc = Math.max(0, data.credits !== undefined ? Number(data.credits) : 0);
          setCredits(fc);
          localStorage.setItem('credits', String(fc));
          localStorage.removeItem('isSubscribed');
          localStorage.removeItem('subscriptionPlan');
          localStorage.removeItem('subscriptionStartedAt');
          localStorage.removeItem('subscriptionExpiresAt');
          if (freeUserData) {
            freeUserData.isSubscribed = false;
            freeUserData.subscriptionPlan = '';
            freeUserData.credits = fc;
            localStorage.setItem('freeUserData', JSON.stringify(freeUserData));
          }
          window.dispatchEvent(new Event('creditsChanged'));
          return;
        }

        const isStillValid = !!(
          data.isSubscribed &&
          (
            (!data.subscriptionExpiresAt || new Date(data.subscriptionExpiresAt).getTime() > Date.now()) ||
            (data.upcomingPlanExpiresAt && new Date(data.upcomingPlanExpiresAt).getTime() > Date.now())
          )
        );

        if (isStillValid) {
          setCredits(99999);
          localStorage.setItem('isSubscribed', 'true');
          localStorage.setItem('subscriptionPlan', data.subscriptionPlan || 'One Day');
          if (data.subscriptionStartedAt) {
            localStorage.setItem('subscriptionStartedAt', data.subscriptionStartedAt);
          }
          if (data.subscriptionExpiresAt) {
            localStorage.setItem('subscriptionExpiresAt', data.subscriptionExpiresAt);
          }
          if (data.upcomingPlan) {
            localStorage.setItem('upcomingPlan', data.upcomingPlan);
          } else {
            localStorage.removeItem('upcomingPlan');
          }
          if (data.upcomingPlanStartsAt) {
            localStorage.setItem('upcomingPlanStartsAt', data.upcomingPlanStartsAt);
          } else {
            localStorage.removeItem('upcomingPlanStartsAt');
          }
          if (data.upcomingPlanExpiresAt) {
            localStorage.setItem('upcomingPlanExpiresAt', data.upcomingPlanExpiresAt);
          } else {
            localStorage.removeItem('upcomingPlanExpiresAt');
          }
          localStorage.setItem('credits', '99999');
          localStorage.removeItem('freeTrialEnded');
          window.dispatchEvent(new Event('creditsChanged'));
          return;
        } else {
          localStorage.setItem('isSubscribed', 'false');
          localStorage.removeItem('upcomingPlan');
          localStorage.removeItem('upcomingPlanStartsAt');
          localStorage.removeItem('upcomingPlanExpiresAt');
          if (data.subscriptionExpiresAt) {
            localStorage.setItem('subscriptionExpiresAt', data.subscriptionExpiresAt);
          } else {
            localStorage.removeItem('subscriptionExpiresAt');
          }
          localStorage.removeItem('subscriptionPlan');
          if (data.subscriptionStartedAt) {
            localStorage.setItem('subscriptionStartedAt', data.subscriptionStartedAt);
          } else {
            localStorage.removeItem('subscriptionStartedAt');
          }
          if (freeUserData) {
            freeUserData.isSubscribed = false;
            if (data.subscriptionExpiresAt) freeUserData.subscriptionExpiresAt = data.subscriptionExpiresAt;
            localStorage.setItem('freeUserData', JSON.stringify(freeUserData));
          }
        }

        const totalSentLocal = parseInt(localStorage.getItem('totalSent') || '0', 10);
        const localCredits = parseInt(localStorage.getItem('credits') || '0', 10);
        const sent = data.totalSent !== undefined ? Math.max(totalSentLocal, Number(data.totalSent)) : totalSentLocal;
        
        let c = localCredits;
        if (isStillValid) {
          c = 99999;
        } else if (!isFreeUser) {
          // Strictly Subscription User: No active paid plan means credits is strictly 0!
          c = 0;
        } else if (data.credits !== undefined) {
          if (totalSentLocal > (data.totalSent || 0)) {
            c = localCredits;
          } else {
            c = Number(data.credits);
          }
        }

        setCredits(c);
        localStorage.setItem('credits', String(c));
        if (freeUserData) {
          freeUserData.credits = c;
          freeUserData.totalSent = sent;
          localStorage.setItem('freeUserData', JSON.stringify(freeUserData));
        }
        localStorage.setItem('totalSent', String(sent));
        window.dispatchEvent(new Event('creditsChanged'));
      }
    } catch (err) {
      console.error('Error in fetchCredits:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAsRead = useCallback(async () => {
    let email = localStorage.getItem('email');
    if (!email) {
      try {
        const freeUserData = JSON.parse(localStorage.getItem('freeUserData') || '{}');
        email = freeUserData.email;
      } catch (e) {}
    }
    if (!email) return;

    try {
      const apiBaseUrl = API_BASE_URL;
      await fetch(`${apiBaseUrl}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, []);

  // Delete a single notification by ID
  const deleteNotification = useCallback(async (id) => {
    if (!id) return;

    try {
      const apiBaseUrl = API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/notifications/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => {
          const updated = prev.filter(n => n._id !== id);
          setUnreadCount(updated.filter(n => !n.read).length);
          return updated;
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  // Add real-time notification push
  const addRealTimeNotification = useCallback((newNotif) => {
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    if (newNotif.creditsEarned && newNotif.creditsEarned > 0) {
      setCredits(prev => {
        const updated = prev + newNotif.creditsEarned;
        localStorage.setItem('credits', updated);
        window.dispatchEvent(new Event('creditsChanged'));
        return updated;
      });
    }
    fetchCredits();
  }, [fetchCredits]);

  // Initial load and polling setup
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isFreeUserLoggedIn = !!localStorage.getItem('freeUserToken') || !!localStorage.getItem('freeUserData');
    const anyLoggedIn = isLoggedIn || isFreeUserLoggedIn;

    if (anyLoggedIn) {
      fetchNotifications();
      fetchCredits();

      const interval = setInterval(() => {
        fetchNotifications();
        fetchCredits();
      }, 5000);

      const expiryTicker = setInterval(() => {
        const expiresAt = localStorage.getItem('subscriptionExpiresAt');
        const isSub = localStorage.getItem('isSubscribed') === 'true';
        if (isSub && expiresAt && expiresAt !== 'null') {
          const expTime = new Date(expiresAt).getTime();
          if (!isNaN(expTime) && expTime <= Date.now()) {
            localStorage.setItem('isSubscribed', 'false');
            localStorage.removeItem('subscriptionPlan');
            localStorage.setItem('credits', '0');
            setCredits(0);
            window.dispatchEvent(new Event('subscriptionExpired'));
            window.dispatchEvent(new Event('creditsChanged'));
          }
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        clearInterval(expiryTicker);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [fetchNotifications, fetchCredits]);

  // Listen for login/credits changes
  useEffect(() => {
    const handleLoginChange = () => {
      const email = localStorage.getItem('email');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const isFreeUserLoggedIn = !!localStorage.getItem('freeUserToken') || !!localStorage.getItem('freeUserData');
      const anyLoggedIn = (isLoggedIn || isFreeUserLoggedIn) && !!email;

      if (anyLoggedIn) {
        fetchNotifications();
        fetchCredits();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    const handleCreditsChange = () => {
      const stored = localStorage.getItem('credits');
      const c = stored !== null ? Math.max(0, parseInt(stored, 10)) : 0;
      setCredits(c);
    };

    window.addEventListener('loginStatusChanged', handleLoginChange);
    window.addEventListener('freeUserLoginStatusChanged', handleLoginChange);
    window.addEventListener('creditsChanged', handleCreditsChange);

    return () => {
      window.removeEventListener('loginStatusChanged', handleLoginChange);
      window.removeEventListener('freeUserLoginStatusChanged', handleLoginChange);
      window.removeEventListener('creditsChanged', handleCreditsChange);
    };
  }, [fetchNotifications, fetchCredits]);

  // Real-time plan expiry watcher (checks every 1s so deactivation & freeze happen instantly)
  useEffect(() => {
    let alreadyExpiredTriggered = false;

    const checkExpiry = () => {
      const isSub = localStorage.getItem('isSubscribed') === 'true';
      const expiresAt = localStorage.getItem('subscriptionExpiresAt');
      if (isSub && expiresAt) {
        const expiryDate = new Date(expiresAt);
        if (expiryDate.getTime() <= Date.now()) {
          if (!alreadyExpiredTriggered) {
            alreadyExpiredTriggered = true;
            console.log('⏰ Subscription expired! Deactivating plan immediately.');
            localStorage.removeItem('isSubscribed');
            localStorage.removeItem('subscriptionPlan');
            localStorage.removeItem('subscriptionStartedAt');
            localStorage.removeItem('subscriptionExpiresAt');
            localStorage.setItem('credits', '0');
            setCredits(0);
            window.dispatchEvent(new Event('creditsChanged'));
            window.dispatchEvent(new Event('subscriptionExpired'));
            fetchCredits();
            fetchNotifications();
          }
        } else {
          alreadyExpiredTriggered = false;
        }
      } else {
        alreadyExpiredTriggered = false;
      }
    };

    const timer = setInterval(checkExpiry, 1000);
    return () => clearInterval(timer);
  }, [fetchCredits, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        credits,
        loading,
        fetchNotifications,
        fetchCredits,
        markAsRead,
        deleteNotification,
        addRealTimeNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
