# MKR 1310, BME280 온습도 차트

## 수집된 온습도 데이터를 js로 생성해서 매일 날짜별로 쌓고, 차트로 보여줌

수집주기 5분간격, 실내 온습도를 포함한 데이터를 TTN, webhook를 통해 DB에 저장  
저장된 데이터는 json 형태로 가공되어, 5분마다 js파일을 갱신 후 git commit 자동화

Google Combo Chart 를 통한 Display  
다만, 누적 챠트로 세부항목등 수정이 필요
