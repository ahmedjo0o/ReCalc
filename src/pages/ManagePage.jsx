import ProfileCard from '../components/manage/ProfileCard.jsx';
import HistoryPreviewCard from '../components/manage/HistoryPreviewCard.jsx';
import FavoritesCard from '../components/manage/FavoritesCard.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ManagePage() {
  const { t } = useLanguage();
  return (
    <main>
      <h1 className="page-title">{t.manageAccountTitle}</h1>
      <div className="cards-grid">
        <ProfileCard />
        <HistoryPreviewCard />
        <FavoritesCard />
      </div>
    </main>
  );
}
