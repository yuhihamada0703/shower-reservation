#!/bin/bash
# 手順4-2（予約まわりのAPI）の動作確認用スクリプト
# 使い方：アプリを起動した状態で、ターミナルで  bash test-step4-2.sh  と入力する
# 学生2人（20230001 山田、20240012 佐藤。パスワードはどちらも pass1234）でログインして、
# 明日の19:00の枠を使って、予約・二重予約・ルール違反・キャンセル・使用状況を順番に確認する

BASE=http://localhost:8080
DIR=$(mktemp -d)
PASS=0
FAIL=0
TOMORROW=$(date -v+1d +%F 2>/dev/null || date -d tomorrow +%F)
YESTERDAY=$(date -v-1d +%F 2>/dev/null || date -d yesterday +%F)
JSON="Content-Type: application/json"

# check "説明" 期待するステータス curlの引数...
# 実行した結果のステータスコードを、期待する値と比べて、OK / NG を表示する
check() {
  desc="$1"; expected="$2"; shift 2
  response=$(curl -s -w "\n%{http_code}" "$@")
  status=$(echo "$response" | tail -n 1)
  LAST_BODY=$(echo "$response" | sed '$d')
  if [ "$status" = "$expected" ]; then
    echo "OK  [$status] $desc"; PASS=$((PASS+1))
  else
    echo "NG  [$status] $desc （期待：$expected）"; FAIL=$((FAIL+1))
  fi
  echo "        $LAST_BODY"
}

# 直前のレスポンスの本文に、指定した文字列が含まれているかを確認する
contains() {
  if echo "$LAST_BODY" | grep -q "$2"; then
    echo "OK  $1"; PASS=$((PASS+1))
  else
    echo "NG  $1 （「$2」が含まれていません）"; FAIL=$((FAIL+1))
  fi
}

body() { echo "{\"reserved_date\":\"$1\",\"room_no\":$2,\"start_time\":\"$3\"}"; }

echo "=== ログイン ==="
check "学生A（山田）でログイン" 200 -c "$DIR/a.txt" -X POST "$BASE/login" -H "$JSON" -d '{"login_id":"20230001","password":"pass1234"}'
check "学生B（佐藤）でログイン" 200 -c "$DIR/b.txt" -X POST "$BASE/login" -H "$JSON" -d '{"login_id":"20240012","password":"pass1234"}'

echo; echo "=== 予約の登録と、予約状況 ==="
check "学生Aが、明日の19:00・シャワー室1を予約" 201 -b "$DIR/a.txt" -X POST "$BASE/reservations" -H "$JSON" -d "$(body $TOMORROW 1 19:00)"
RID=$(echo "$LAST_BODY" | sed -n 's/.*"reservation_id": *\([0-9]*\).*/\1/p')
RID=${RID:-0}
echo "        （予約ID：$RID）"
check "学生Aが予約状況を見る" 200 -b "$DIR/a.txt" "$BASE/reservations"
contains "自分の予約には is_mine:true が付く" '"is_mine": *true'
check "学生Bが予約状況を見る" 200 -b "$DIR/b.txt" "$BASE/reservations"
contains "ほかの学生の予約は is_mine:false で、予約IDは見えない" '"reservation_id": *null'

echo; echo "=== 二重予約（409） ==="
check "学生Bが、同じ枠を予約しようとする" 409 -b "$DIR/b.txt" -X POST "$BASE/reservations" -H "$JSON" -d "$(body $TOMORROW 1 19:00)"
check "学生Aが、同じ時間帯のシャワー室2も予約しようとする" 409 -b "$DIR/a.txt" -X POST "$BASE/reservations" -H "$JSON" -d "$(body $TOMORROW 2 19:00)"

echo; echo "=== 予約のルール違反（400） ==="
check "昨日の日付" 400 -b "$DIR/a.txt" -X POST "$BASE/reservations" -H "$JSON" -d "$(body $YESTERDAY 1 19:00)"
contains "メッセージ：当日と翌日のみ" "予約できるのは当日と翌日です"
check "15分刻みでない時刻（19:07）" 400 -b "$DIR/a.txt" -X POST "$BASE/reservations" -H "$JSON" -d "$(body $TOMORROW 1 19:07)"
check "利用時間外の時刻（23:00）" 400 -b "$DIR/a.txt" -X POST "$BASE/reservations" -H "$JSON" -d "$(body $TOMORROW 1 23:00)"
check "シャワー室の番号が3" 400 -b "$DIR/a.txt" -X POST "$BASE/reservations" -H "$JSON" -d "$(body $TOMORROW 3 19:00)"
check "日付の形式が違う" 400 -b "$DIR/a.txt" -X POST "$BASE/reservations" -H "$JSON" -d '{"reserved_date":"abc","room_no":1,"start_time":"19:00"}'

echo; echo "=== キャンセル ==="
check "学生Bが、学生Aの予約をキャンセルしようとする" 403 -b "$DIR/b.txt" -X DELETE "$BASE/reservations/$RID"
check "学生Aが、自分の予約をキャンセルする" 200 -b "$DIR/a.txt" -X DELETE "$BASE/reservations/$RID"
check "もう一度キャンセルする" 404 -b "$DIR/a.txt" -X DELETE "$BASE/reservations/$RID"

echo; echo "=== 使用状況 ==="
check "使用状況を見る" 200 -b "$DIR/a.txt" "$BASE/usage"
echo "        （10:00〜23:00なら EMPTY、それ以外の時間帯なら OUT_OF_HOURS が表示されます）"

echo; echo "=== 権限 ==="
check "ログインしていない状態で予約状況を見る" 401 "$BASE/reservations"

echo; echo "==============================="
echo "OK：$PASS 件　NG：$FAIL 件"
rm -rf "$DIR"
