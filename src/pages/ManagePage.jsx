import ProfileCard from '../components/manage/ProfileCard.jsx';
import HistoryPreviewCard from '../components/manage/HistoryPreviewCard.jsx';
import FavoritesCard from '../components/manage/FavoritesCard.jsx';
import SignInRequired from '../components/auth/SignInRequired.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ManagePage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  return (
    <main>
      <h1 className="page-title">{t.manageAccountTitle}</h1>
      {!loading && !user && <SignInRequired message={t.signInRequiredManage} />}
      {user && (
        <div className="cards-grid">
          <ProfileCard />
          <HistoryPreviewCard />
          <FavoritesCard />
        </div>
      )}
    </main>
  );
}
