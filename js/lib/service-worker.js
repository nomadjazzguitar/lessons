const CACHE_NAME = "jgn-images-v1";

const IMAGES = [

	"logo.png",
	"fretboard-maple.png",
	"fretboard-rosewood.png"

];

self.addEventListener("install", event => {

	event.waitUntil(

		caches.open(CACHE_NAME).then(async cache => {

			for (const image of IMAGES) {

				try {

					console.log("Guardando:", image);

					await cache.add(image);

					console.log("OK");

				}
				catch (e) {

					console.error("ERROR:", image, e);

				}

			}

		})

	);

});

/*
self.addEventListener("install", event => {

	event.waitUntil(

		caches.open(CACHE_NAME).then(cache => {

			return cache.addAll(IMAGES);

		})

	);

});
*/
self.addEventListener("fetch", event => {

	if (event.request.destination !== "image") {

		return;

	}

	event.respondWith(

		caches.match(event.request).then(response => {

			return response || fetch(event.request);

		})

	);

});