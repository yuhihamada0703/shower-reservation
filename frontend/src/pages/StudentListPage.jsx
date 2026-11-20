import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client.js";
import { deleteStudent, listStudents } from "../api/students.js";
import LogoutButton from "../components/LogoutButton.jsx";
import Modal from "../components/Modal.jsx";

/**
 * 学生一覧画面（/students）。教師用。
 * 登録されている学生の一覧を表示して、卒業などで使わなくなった学生を、確認のポップアップのあとに削除する。
 * 学生を削除すると、その学生の予約も、一緒に削除される。
 */
export default function StudentListPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null); // 削除の確認中の学生
  const [deleting, setDeleting] = useState(false);
  const [keyword, setKeyword] = useState("");

  const applyList = useCallback((data) => {
    setStudents(data.students);
    setError(null);
    setLoading(false);
  }, []);
  const applyLoadError = useCallback(() => {
    setError("学生一覧を取得できませんでした");
    setLoading(false);
  }, []);

  const reload = useCallback(
    () => listStudents().then(applyList, applyLoadError),
    [applyList, applyLoadError],
  );

  // 画面を開いたときに、1回取得する
  useEffect(() => {
    let cancelled = false;
    listStudents().then(
      (data) => {
        if (!cancelled) applyList(data);
      },
      () => {
        if (!cancelled) applyLoadError();
      },
    );
    return () => {
      cancelled = true;
    };
  }, [applyList, applyLoadError]);

  // 確認ポップアップの「削除する」
  const handleDelete = async () => {
    setDeleting(true);
    setNotice(null);
    try {
      await deleteStudent(target.login_id);
      setStudents((previous) =>
        previous.filter((student) => student.login_id !== target.login_id),
      );
      setNotice(`${target.name}さんを削除しました`);
      setError(null);
    } catch (e) {
      const message =
        e instanceof ApiError && e.status === 404
          ? "対象の学生が見つかりませんでした。一覧を更新しました"
          : "削除できませんでした。もう一度お試しください";
      // 一覧を取り直してから、メッセージを表示する（取り直すと、前のメッセージが消えるため）
      await reload();
      setError(message);
    } finally {
      setDeleting(false);
      setTarget(null);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.includes(keyword),
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">
          予約管理システム<span className="app-role">教師用</span>
        </h1>
        <div className="app-header-actions">
          <LogoutButton className="button button-secondary button-small" />
        </div>
      </header>

      <main className="dashboard">
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <section className="sheet" aria-labelledby="students-title">
          <div className="panel-head">
            <h2 id="students-title" className="panel-title">
              学生一覧
            </h2>
            {!loading && (
              <p className="count">登録数：{filteredStudents.length}人</p>
            )}
          </div>

          <input
            value={keyword}
            placeholder="名前で検索"
            aria-label="名前で検索"
            onChange={(e) => setKeyword(e.target.value)}
          />

          {loading && <p className="note">読み込んでいます…</p>}
          {!loading && students.length === 0 && !error && (
            <p className="empty-note">登録されている学生は、まだいません。</p>
          )}

          {!loading && students.length > 0 && filteredStudents.length === 0 && (
            <p className="empty-note">一致する学生はいません。</p>
          )}

          {filteredStudents.length > 0 && (
            <div className="table-wrap">
              <table className="student-table">
                <caption className="visually-hidden">
                  登録されている学生の一覧
                </caption>
                <thead>
                  <tr>
                    <th scope="col">名前</th>
                    <th scope="col">学年</th>
                    <th scope="col">所属部活</th>
                    <th scope="col">メールアドレス</th>
                    <th scope="col">
                      <span className="visually-hidden">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.login_id}>
                      <td>{student.name}</td>
                      <td>{student.grade}</td>
                      <td>{student.club ?? ""}</td>
                      <td className="student-email">{student.email}</td>
                      <td>
                        <button
                          type="button"
                          className="button button-danger button-small"
                          aria-label={`${student.name}を削除`}
                          onClick={() => setTarget(student)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {target && (
        <Modal
          title="この学生を削除しますか？"
          onClose={() => (deleting ? undefined : setTarget(null))}
        >
          <dl className="summary">
            <dt>名前</dt>
            <dd>{target.name}</dd>
            <dt>学年</dt>
            <dd>{target.grade}</dd>
            <dt>所属部活</dt>
            <dd>{target.club ?? "（なし）"}</dd>
            <dt>メールアドレス</dt>
            <dd>{target.email}</dd>
          </dl>
          <p className="warning">
            この学生の予約も、一緒に削除されます。削除したあとは、元に戻せません。
          </p>
          <div className="actions">
            <button
              type="button"
              className="button button-danger-fill"
              onClick={handleDelete}
              disabled={deleting}
            >
              削除する
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setTarget(null)}
              disabled={deleting}
            >
              キャンセル
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
