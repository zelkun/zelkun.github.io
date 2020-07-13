var apiUrl = 'https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByGeo/json';
//var alertMsg = '본 사이트는 위치정보를 필요로하며\n공공데이터포털:\n건강보험심사평가원 공적 마스크 판매 정보와 \n국립중앙의료원(약국정보)\nAPI를 사용하고 있습니다\n마스크 구매시 참고자료로만 활용해주시기 바랍니다';
var alertMsg = '공적마스크 판매가 2020/7/8 부로 종료되어, 서비스를 중지합니다.\n 이용해주셔서 감사합니다.';
var HOME_PATH = window.HOME_PATH || '.';
var map = null;
var circle = null;
var infoWindow = null;
var markers = [];
var pre_window = null;
var myip = null;
var cnt = 0;
var circlePoint = null;
var distance = 500;
var drawCircleOnMap = null;
var geoPos = {
	lat: null,
	lng: null
};
var ipPos = {
	lat: null,
	lng: null
};

// 법정동 시도 코드
var sido = {
	'서울': 11, '부산': 26, '대구': 27, '인천': 28, '광주': 29
	, '대전': 30, '울산': 31, '세종특별자치시': 36, '경기': 41
	, '강원': 42, '충북': 43, '충남': 44, '전북': 45
	, '전남': 46, '경북': 47, '경남': 48, '제주특별자치도': 50
	, '서울특별시': 11, '부산광역시': 26, '대구광역시': 27
	, '인천광역시': 28, '광주광역시': 29, '대전광역시': 30
	, '울산광역시': 31, '세종특별자치시': 36, '경기도': 41
	, '강원도': 42, '충청북도': 43, '충청남도': 44
	, '전라북도': 45, '전라남도': 46, '경상북도': 47
	, '경상남도': 48, '제주특별자치도': 50
}
var pharmJson = null;
var week = ['월', '화', '수', '목', '금', '토', '일', '공휴일'];
var today = {
	date: null
	, year: null
	, month: null
	, day: null
	, hour: null
	, minute: null
	, week: null
	, isHoliday: false
	, fullDay: function (sep = '') {
		return this.year + sep + fnNumFormat(this.month) + sep + fnNumFormat(this.day);
	}
};

/**
 * left.
 *
 * @author	ZelKun
 * @since	v0.0.1
 * @version	v1.0.0	Wednesday, April 22nd, 2020.
 * @global
 * @param	string	s
 * @param	number	c	
 * @return	string
 */
function left(s, c) {
	return s.substr(0, c);
}

/**
 * right.
 *
 * @author	ZelKun
 * @since	v0.0.1
 * @version	v1.0.0	Wednesday, April 22nd, 2020.
 * @global
 * @param	string	s
 * @param	number	c	
 * @return	mixed
 */
function right(s, c) {
	return s.substr(-c);
}

/**
 * mid.
 *
 * @author	ZelKun
 * @since	v0.0.1
 * @version	v1.0.0	Wednesday, April 22nd, 2020.
 * @global
 * @param	string	s
 * @param	number	c, l	
 * @return	string
 */
function mid(s, c, l) {
	return s.substring(c, l);
}

/**
 * copy.
 *
 * @author	ZelKun
 * @since	v0.0.1
 * @version	v1.0.0	Wednesday, April 22nd, 2020.
 * @global
 * @param	string	s
 * @param 	number	c, l	
 * @return	string
 */
function copy(s, c, l) {
	return s.substr(c, l);
}

function fnGetDate() {
	var date = new Date();
	today.date = date;
	today.year = date.getFullYear();
	today.month = date.getMonth() + 1;
	today.day = date.getDate();
	today.hour = date.getHours();
	today.minute = date.getMinutes();
	today.week = date.getDay(); // sun ~ sat

	if (today.week == 0) // pharm.json <= mon ~ sun
		today.week = 6;
	else
		today.week -= 1;
}

function fnNumFormat(num) {
	if (num < 10)
		return '0' + num;
	else
		return num;
}

$(document).ready(function () {
	fnGetDate();
	fnGetHoliday();
	alert(alertMsg);
	$('#distance').change(function () {
		fnCircle();
		fnSetZoom();
		$('#search').click();
	});

	$('#mylocation').click(function () {
		fnGetLocation();
	});

	$("#search").click(function () {
		fn_markerRemoveAll();
		fnSetParam();
		var queryParams = '?' + encodeURIComponent('m') + '=' + distance;
		queryParams += '&' + encodeURIComponent('lat') + '=' + geoPos.lat;
		queryParams += '&' + encodeURIComponent('lng') + '=' + geoPos.lng;
		// console.log(queryParams)
		fnGetJson(apiUrl + queryParams, fnSetMaker);
	});

	$('#closed').change(function () {
		$("#search").click();
	});
});

function fnSetParam() {
	geoPos.lat = map.getCenter().lat();
	geoPos.lng = map.getCenter().lng();
	distance = $("#distance").val();
}

function fnSetMaker(data) {
	//console.log(data, data.count);
	cnt = 0;
	if (data.count > 0) {
		for (var i = 0; i < data.stores.length; i++) {
			row = data.stores[i];
			//console.log(row.remain_stat)

			if (fnValidation(row)) {
				var state = fnGetIcon(row.remain_stat);
				var marker = fnGetMarker(row, state);

				//Marker event
				marker.addListener('mouseover', fnMousOver(cnt));
				marker.addListener('mouseout', fnMouseOut(cnt));
				marker.addListener('click', fnClick(cnt));

				markers.push(marker);
				cnt++;
			}
		}

		//fnSetZoom();
		if (cnt == 0) {
			if ($('#closed').is(':checked')) {
				alert($('#distance option:selected').text() + ' 이내에 영업중인 판매처가 없거나, 재고가 없습니다');
			} else {
				alert($('#distance option:selected').text() + ' 이내에 재고가 없습니다');
			}
		} else if (cnt == 1) {
			markers[0].infoWindow.open(map, markers[0]);
			pre_window = markers[0];
		}
	} else {
		alert($('#distance option:selected').text() + ' 이내에 판매처가 없습니다');
	}
}

function fn_markerRemoveAll() {
	if(pre_window)
		pre_window.infoWindow.close();
	markers.map(function (r, i) {
		r.setMap(null);
	});
	markers = [];
}

function fnCircle() {
	fnSetParam();
	drawCircleOnMap(geoPos, distance);
}

function fnSetZoom() {
	var pos = {
		lat: geoPos.lat,
		lng: geoPos.lng
	};
	map.setCenter(pos);
	if (distance > 1000) {
		map.setZoom(13);
	} else if (distance > 500) {
		map.setZoom(15);
	} else if (distance > 100) {
		map.setZoom(16);
	} else {
		map.setZoom(17);
	}
}

function fnGetJson(url, fnCallback) {
	// console.log(url)
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	xhr.onreadystatechange = function () {
		console.log(this)
		if (this.readyState == 4) {
			// alert('Status: '+this.status+' Headers: '+JSON.stringify(this.getAllResponseHeaders())+' Body: '+this.responseText);
			// console.log('Status: '+this.status,' Headers: ', JSON.stringify(this.getAllResponseHeaders()),' Body: ',this.responseText);

			if(this.responseText != ''){
				fnCallback(JSON.parse(this.responseText));
			} else{
				alert('현황데이터 조회에 실패하였습니다.\n잠시후 다시 시도해주세요.');
			}
		}
	};
	xhr.send();
}

/**
 * fnGetIpPos.
 * SSL 사용불가
 */
function fnGetIpPos(ip) {
	var url = 'http://jsonip.com';
	fnGetJson(url, function (data) {
		myip = data.ip;
		var url = 'http://ip-api.com/json/' + myip;
		fnGetJson(url, function (data) {
			// console.log(data)
			ipPos = {
				lat: Number(data.lat),
				lng: Number(data.lon)
			};
			fnIpGeoSearch();
		});
	});
}

function fnIpGeoSearch() {
	var pos = {
		lat: ipPos.lat,
		lng: ipPos.lng
	};
	if (infoWindow != null) {
		infoWindow.setPosition(pos);
	}
	map.setCenter(pos);
	fnCircle();
	fnSetZoom();

	$('#search').click();
}

var first = false;
function fnGetLocation() {
	// Try HTML5 geolocation.
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(onSuccessGeolocation, onErrorGeolocation);
		if (!first) {
			first = true;
			// fnGetAddr();
		}
	} else {
		// Browser doesn't support Geolocation
		handleLocationError(false, infoWindow, map.getCenter());
	}
}

function fnGetIcon(data) {
	var iconUrl = 'https://maps.google.com/mapfiles/ms/icons/';
	var msg = '100개이상';
	if (data == 'plenty') {
		iconUrl += 'green-dot.png';
		msg = '100개 이상';
	} else if (data == 'some') {
		iconUrl += 'yellow-dot.png';
		msg = '30~100개 이하';
	} else if (data == 'few') {
		iconUrl += 'red-dot.png';
		msg = '2~30개 이하';
	} else {
		iconUrl += 'purple.png';
		msg = '0~1개';
	}
	var rst = { msg: msg, iconUrl: iconUrl };
	return rst;
}

function fnGetPharmTime(open, close) {
	return left(open, 2).concat(':', right(open, 2), ' ~ ', left(close, 2), ':', right(close, 2));
}

function fnMarkerInfoWindowHtml(row, state, option = 'google') {
	var htmlStr = '<div';
	if (option != 'google') {
		htmlStr += ' class="infowindow"';
	}
	htmlStr += '>';
	htmlStr += '<b>' + row.name + '</b>';
	htmlStr += '<br/>주소: ' + row.addr;
	htmlStr += '<br/>수량: ' + state.msg;
	htmlStr += '<br/>입고시간: ' + row.stock_at;

	//약국
	if (row.type == '01' && pharmJson != null) {
		var pharmInfo = pharmJson[row.code];
		if (pharmInfo) { // 정보유무
			var open = pharmInfo.open[today.week];
			var close = pharmInfo.close[today.week];
			htmlStr += '<br/>영업시간: ';
			if (open != '' && close != '') {
				htmlStr += '(' + week[today.week] + ') ';
				htmlStr += '<b>' + fnGetPharmTime(open, close) + '</b>';
			} else {
				htmlStr += '<b>휴일</b>';
			}
			htmlStr += '<br/>전화번호: ' + pharmInfo.tel;
		}
	} else if (row.type == '02') { // 우체국
		htmlStr += '<br/>영업시간: ';
		// 주말제외
		if (today.week < 5) {
			htmlStr += '<b>09:00 ~ 18:00</b>';
		} else { //평일 09 ~ 18시
			htmlStr += '<b>영업 종료</b>';
		}
	}

	htmlStr += '</div>';
	return htmlStr;
}

function fnMousOver(seq) {
	//console.log('mouseover', seq)
	return function (e) {
		var marker = markers[seq];
		marker.infoWindow.open(map, marker);
		marker.infoWindow.setZIndex(-1);
	}
}
function fnMouseOut(seq) {
	//console.log('mouseout', seq)
	return function (e) {
		var marker = markers[seq];
		marker.infoWindow.close();
	}
}

function fnClick(seq) {
	//console.log('click', seq)
	return function (e) {
		if (pre_window != null) {
			pre_window.infoWindow.close();
		}
		var marker = markers[seq];
		marker.infoWindow.open(map, marker);
		marker.infoWindow.setZIndex(-1);
		map.setCenter({ lat: marker.data.lat, lng: marker.data.lng });
		pre_window = marker;

		fnCircle();
		// $("#search").click();
	}
}

function fnGetAddr() {
	var param = {
		x: geoPos.lng
		, y: geoPos.lat
		, input_coord: 'WGS84'
	}

	$.ajax({
		url: 'https://dapi.kakao.com/v2/local/geo/coord2address.json'
		, type: 'GET'
		, data: param
		, dataType: 'JSON'
		, beforeSend: function (xhr) {
			xhr.setRequestHeader('Content-type", "application/json;charset=UTF-8');
			xhr.setRequestHeader('Cache-Control", "no-cache');
			xhr.setRequestHeader('Authorization', 'KakaoAK '.concat('카카오API_KEY'));
		}
		, success: function (data) {
			if (data.meta.total_count > 0) {
				var HOME_PATH = window.HOME_PATH || '.';
				//console.log(sido[data.documents[data.meta.total_count - 1].address.region_1depth_name])
				var sido_code = sido[data.documents[data.meta.total_count - 1].address.region_1depth_name];
				$.getJSON(HOME_PATH + '/pharm/' + sido_code + ".json", function (json) {
					// console.log(json); // this will show the info it in firebug console
					pharmJson = json;
				});
			}
		}
		, error: function (xhr, status, error) {
			console.log(xhr, status, error)
		}
		, complete: function () {
			// console.log('complate')
		}
	});
}

function fnGetHoliday(){
	// holiday
	$.getJSON(HOME_PATH + '/holiday.json', function (holidayJson) {
		for(var i=0; i<holidayJson.holiday.length; i++){
			if(holidayJson.holiday[i] == today.fullDay()){
				today.isHoliday = true;
				today.week = 7;
			}
		}
	});
}

function fnValidation(row) {
	if (cnt == 0) {
		var sido_code = sido[row.addr.substring(0, row.addr.indexOf(' '))];
		// console.log(sido_code)
		$.getJSON(HOME_PATH + '/pharm/' + sido_code + ".json", function (json) {
			// console.log(json); // this will show the info it in firebug console
			pharmJson = json;
		});
	}

	// 재고부족 제외
	if (row.remain_stat == 'break' || row.remain_stat == 'empty' || row.remain_stat == null) {
		return false;
	}

	var closed = $('#closed').is(':checked');
	if (closed && row.type == '01' && pharmJson != null) {
		var pharmInfo = pharmJson[row.code];
		if (pharmInfo) { // 정보유무
			var open = pharmInfo.open[today.week];
			var close = pharmInfo.close[today.week];
			if (open == '' || close == '') {
				return false;
			}
			var now = today.hour * 100 + today.minute;
			if (now < Number(open) || now > Number(close)) {
				return false;
			}
		}
	} else if (closed && row.type == '02') { // 우체국
		if (today.week < 5 && !today.isHoliday) {
			if (today.hour < 9 || today.hour > 18) {
				return false;
			}
		} else { //평일 09 ~ 18시
			return false;
		}
	}

	return true;
}