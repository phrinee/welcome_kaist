const rating = document.getElementById("rate")
rating.setAttribute('disabled', 'disabled')
check1 = document.getElementById("rating-1")
check2 = document.getElementById("rating-2")
check3 = document.getElementById("rating-3")
check4 = document.getElementById("rating-4") 
check5 = document.getElementById("rating-5")
checks = [check1, check2, check3, check4, check5]

for (var i = 0; i< checks.length; i++) {
	checks[i].onclick = () => {
		rating.removeAttribute('disabled')
	}
}

rating.onclick = () => {
	location.href = '/'
}