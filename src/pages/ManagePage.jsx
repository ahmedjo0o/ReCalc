import { Link, useSearchParams } from 'react-router-dom';
import ProfileCard from '../components/manage/ProfileCard.jsx';
import HistoryPreviewCard from '../components/manage/HistoryPreviewCard.jsx';
import FavoritesCard from '../components/manage/FavoritesCard.jsx';
import GroupsCard from '../components/manage/GroupsCard.jsx';
import SharedBillsCard from '../components/manage/SharedBillsCard.jsx';
import DeleteAccountCard from '../components/manage/DeleteAccountCard.jsx';
import SignInRequired from '../components/auth/SignInRequired.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const TABS = ['bills', 'people', 'account'];

// Three tabs instead of one long page of cards:
//   Bills   - shared bills still open, and recent calculations
//   People  - favorite names and saved groups
//   Account - name, currency, password, delete account
// The tab lives in the URL (?tab=people) so it survives a refresh and can be
// linked to.
export default function ManagePage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'bills';

  if (!user) {
    return (
      <main>
        <h1 className="page-title">{t.manageAccountTitle}</h1>
        {!loading && <SignInRequired message={t.signInRequiredManage} />}
      </main>
    );
  }

  const label = { bills: t.manageTabBills, people: t.manageTabPeople, account: t.manageTabAccount };
  const displayName = user.displayName || user.email || '';

  return (
    <main className="manage">
      <div className="manage-head">
        <div className="manage-head__avatar" aria-hidden="true">{(displayName.trim()[0] || '?').toUpperCase()}</div>
        <div className="manage-head__text">
          <h1 className="manage-head__name">{displayName}</h1>
          {user.displayName && user.email && <div className="manage-head__email">{user.email}</div>}
        </div>
        <Link to="/" className="btn btn-primary btn-sm">{t.newBillButton}</Link>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`tabs__tab${tab === key ? ' is-active' : ''}`}
            onClick={() => setParams(key === 'bills' ? {} : { tab: key }, { replace: true })}
          >
            {label[key]}
          </button>
        ))}
      </div>

      {tab === 'bills' && (
        <div className="manage-stack">
          <SharedBillsCard />
          <HistoryPreviewCard />
        </div>
      )}
      {tab === 'people' && (
        <div className="manage-stack">
          <GroupsCard />
          <FavoritesCard />
        </div>
      )}
      {tab === 'account' && (
        <div className="manage-stack">
          <ProfileCard />
          <DeleteAccountCard />
        </div>
      )}
    </main>
  );
}
