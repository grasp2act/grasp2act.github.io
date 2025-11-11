document.addEventListener('DOMContentLoaded', function () {
  // Simulation Results embodiment navigation with swipe transitions and placeholder mapping
  var label = document.getElementById('sim-embodiment-label');
  var prevBtn = document.getElementById('sim-embodiment-prev');
  var nextBtn = document.getElementById('sim-embodiment-next');
  var grid = document.getElementById('sim-grid');
  var embodiments = ['Oracle', 'UR10e', 'UAM'];
  var idx = 0;

  // Placeholder mapping: update the filenames here per embodiment and task
  // keys are the data-task values in the DOM
  var sourcesByEmbodiment = {
    'Oracle': {
      cabinet: './static/videos/sim_task_cabinet.mp4',           // TODO: replace with oracle-specific file
      pick_and_place: './static/videos/sim_task_pick_and_place.mp4', // TODO: replace
      rotate_valve: './static/videos/sim_task_rotate_valve.mp4',  // TODO: replace
      peg_in_hole: './static/videos/sim_task_peg_in_hole.mp4'     // TODO: replace
    },
    'UR10e': {
      cabinet: './static/videos/sim_task_cabinet_ur10e.mp4',           // TODO: replace with ur10e-specific file
      pick_and_place: './static/videos/sim_task_pick_and_place_ur10e.mp4',
      rotate_valve: './static/videos/sim_task_rotate_valve_ur10e.mp4',
      peg_in_hole: './static/videos/sim_task_peg_in_hole_ur10e.mp4'
    },
    'UAM': {
      cabinet: './static/videos/sim_task_cabinet_uam.mp4',           // TODO: replace with uam-specific file
      pick_and_place: './static/videos/sim_task_pick_and_place_uam.mp4',
      rotate_valve: './static/videos/sim_task_rotate_valve_uam.mp4',
      peg_in_hole: './static/videos/sim_task_peg_in_hole_uam.mp4'
    }
  };

  var applySources = function(name) {
    if (!grid) return;
    var mapping = sourcesByEmbodiment[name] || sourcesByEmbodiment['Oracle'];
    var videos = grid.querySelectorAll('video.sim-task-video');
    videos.forEach(function(v){
      var task = v.getAttribute('data-task');
      var src = mapping[task];
      if (!src) return;
      var sourceEl = v.querySelector('source');
      if (!sourceEl) return;
      sourceEl.setAttribute('src', src);
      v.load();
      v.currentTime = 0;
      var p = v.play();
      if (p && typeof p.then === 'function') { p.catch(function(){}); }
    });
  };

  var doSwipe = function(direction) {
    if (!grid) return;
    var columns = grid.querySelectorAll('.column');
    
    // Reverse mapping: clicking right moves content left, clicking left moves content right
    var slideOutClass = direction === 'left' ? 'sim-slide-out-right' : 'sim-slide-out-left';
    var slideInClass = direction === 'left' ? 'sim-slide-in-left' : 'sim-slide-in-right';
    
    // Slide out current videos
    columns.forEach(function(col){ col.classList.add(slideOutClass); });
    
    // Wait for slide out animation to complete
    setTimeout(function(){
      // Disable transitions briefly to reposition instantly
      columns.forEach(function(col){ col.classList.add('sim-no-transition'); });

      // Reset slide-out class and set slide-in start position (off-screen opposite side)
      columns.forEach(function(col){ 
        col.classList.remove(slideOutClass);
        col.classList.add(slideInClass);
      });

      // Swap video sources and restart while off-screen
      applySources(embodiments[idx]);

      // Force reflow
      void grid.offsetWidth;

      // Re-enable transitions
      columns.forEach(function(col){ col.classList.remove('sim-no-transition'); });

      // Slide in to final position
      requestAnimationFrame(function(){
        columns.forEach(function(col){ col.classList.remove(slideInClass); });
      });
    }, 450);
  };

  if (label && prevBtn && nextBtn) {
    var update = function () { label.textContent = embodiments[idx]; };
    prevBtn.addEventListener('click', function () {
      var dir = 'left';
      idx = (idx - 1 + embodiments.length) % embodiments.length;
      update();
      doSwipe(dir);
    });
    nextBtn.addEventListener('click', function () {
      var dir = 'right';
      idx = (idx + 1) % embodiments.length;
      update();
      doSwipe(dir);
    });
    update();
    applySources(embodiments[idx]);
  }
});

// RW Results: control autoplay once and restart all on demand
document.addEventListener('DOMContentLoaded', function(){
  var rwSection = document.getElementById('rw-results');
  if (!rwSection) return;
  var videos = rwSection.querySelectorAll('video.rw-video');
  var restartBtn = document.getElementById('rw-restart');

  // Ensure not playing initially
  videos.forEach(function(v){ v.pause(); v.loop = false; });

  // Observe the peg-in-hole grid container only
  var box = document.getElementById('rw-pih') || rwSection;
  var hasInit = false;
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.target !== box) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        videos.forEach(function(v){
          if (!hasInit) { v.currentTime = 0; }
          if (!v.ended) {
            var p = v.play();
            if (p && typeof p.then === 'function') { p.catch(function(){}); }
          }
        });
        hasInit = true;
      } else {
        videos.forEach(function(v){ if (!v.ended) { v.pause(); } });
      }
    });
  }, { threshold: [0, 0.5, 1], rootMargin: '0px 0px -25% 0px' });
  observer.observe(box);

  // Restart all videos with one button
  if (restartBtn) {
    restartBtn.addEventListener('click', function(){
      videos.forEach(function(v){
        v.currentTime = 0;
        var p = v.play();
        if (p && typeof p.then === 'function') { p.catch(function(){}); }
      });
    });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  var video = document.getElementById('method-video');
  var bar = document.querySelector('#method .video-progress__bar');
  if (!video || !bar) return;

  var rafId = null;
  var animate = function () {
    if (video.duration && !isNaN(video.duration)) {
      var cutoff = video.duration * 0.75; // bar completes at 75% of video
      var ratio = Math.min(Math.max(video.currentTime / cutoff, 0), 1);
      bar.style.width = (ratio * 100) + '%';
    }
    rafId = requestAnimationFrame(animate);
  };

  var start = function(){ if (!rafId) rafId = requestAnimationFrame(animate); };
  var stop = function(){ if (rafId) { cancelAnimationFrame(rafId); rafId = null; } };

  video.addEventListener('loadedmetadata', start);
  video.addEventListener('play', start);
  video.addEventListener('pause', stop);
  video.addEventListener('ended', function(){ bar.style.width = '100%'; stop(); });

  // Kick once in case autoplay fires before events
  // start();

  // Restart handler
  var restartBtn = document.querySelector('#method .video-restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function(){
      try {
        video.currentTime = 0;
        // Ensure playing resumes for autoplay/loop
        var playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(function(){});
        }
      } catch (e) {}
    });
  }

  // Intersection observer to control autoplay based on visibility of the video element (>= 40%)
  try {
    if (video) {
      var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            var p = video.play();
            if (p && typeof p.then === 'function') { p.catch(function(){}); }
          } else {
            video.pause();
          }
        });
      }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
      observer.observe(video);
    }
  } catch (e) {}
});

// Problem/EADP section controls
document.addEventListener('DOMContentLoaded', function () {
  var pVideo = document.getElementById('problem-video');
  var pBar = document.querySelector('#problem .video-progress__bar');
  var pRestart = document.querySelector('#problem .video-restart-btn');
  var pSection = document.getElementById('problem');
  if (!pVideo || !pBar || !pSection) return;

  var rafId = null;
  var animate = function () {
    if (pVideo.duration && !isNaN(pVideo.duration)) {
      // Complete bar at 100% of video duration for EADP video
      var ratio = Math.min(Math.max(pVideo.currentTime / pVideo.duration, 0), 1);
      pBar.style.width = (ratio * 100) + '%';
    }
    rafId = requestAnimationFrame(animate);
  };
  var start = function(){ if (!rafId) rafId = requestAnimationFrame(animate); };
  var stop = function(){ if (rafId) { cancelAnimationFrame(rafId); rafId = null; } };

  pVideo.addEventListener('loadedmetadata', function(){ /* noop */ });
  pVideo.addEventListener('play', start);
  pVideo.addEventListener('pause', stop);
  pVideo.addEventListener('ended', function(){ pBar.style.width = '100%'; stop(); });

  if (pRestart) {
    pRestart.addEventListener('click', function(){
      try {
        pVideo.currentTime = 0;
        var playPromise = pVideo.play();
        if (playPromise && typeof playPromise.then === 'function') { playPromise.catch(function(){}); }
      } catch (e) {}
    });
  }

  try {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          var p = pVideo.play();
          if (p && typeof p.then === 'function') { p.catch(function(){}); }
        } else {
          pVideo.pause();
        }
      });
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
    observer.observe(pVideo);
  } catch (e) {}
});

// Lemon trials toggle functionality
document.addEventListener('DOMContentLoaded', function () {
  var toggleBtn = document.getElementById('lemon-toggle-btn');
  var toggleText = document.getElementById('lemon-toggle-text');
  var toggleIcon = document.getElementById('lemon-toggle-icon');
  var trialsContainer = document.getElementById('lemon-trials-container');
  var lemonVideos = document.querySelectorAll('.lemon-video');
  var restartBtn = document.getElementById('lemon-restart');
  var isExpanded = false;

  if (!toggleBtn || !trialsContainer) return;

  toggleBtn.addEventListener('click', function() {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      // Expand
      trialsContainer.style.maxHeight = '1000px';
      trialsContainer.style.opacity = '1';
      trialsContainer.style.marginTop = '2rem';
      toggleText.textContent = 'See Less';
      toggleIcon.classList.remove('fa-chevron-down');
      toggleIcon.classList.add('fa-chevron-up');
      
      // Play all videos when expanded
      setTimeout(function() {
        lemonVideos.forEach(function(video) {
          var p = video.play();
          if (p && typeof p.then === 'function') { p.catch(function(){}); }
        });
      }, 300);
    } else {
      // Collapse
      trialsContainer.style.maxHeight = '0';
      trialsContainer.style.opacity = '0';
      trialsContainer.style.marginTop = '0';
      toggleText.textContent = 'Show Trials';
      toggleIcon.classList.remove('fa-chevron-up');
      toggleIcon.classList.add('fa-chevron-down');
      
      // Pause all videos when collapsed
      lemonVideos.forEach(function(video) {
        video.pause();
        video.currentTime = 0;
      });
    }
  });

  // Restart button functionality - play all videos at once
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      lemonVideos.forEach(function(video) {
        video.currentTime = 0;
        var p = video.play();
        if (p && typeof p.then === 'function') { p.catch(function(){}); }
      });
    });
  }
});

// Lightbulb trials toggle functionality
document.addEventListener('DOMContentLoaded', function () {
  var toggleBtn = document.getElementById('lightbulb-toggle-btn');
  var toggleText = document.getElementById('lightbulb-toggle-text');
  var toggleIcon = document.getElementById('lightbulb-toggle-icon');
  var trialsContainer = document.getElementById('lightbulb-trials-container');
  var lightbulbVideos = document.querySelectorAll('.lightbulb-video');
  var restartBtn = document.getElementById('lightbulb-restart');
  var isExpanded = false;

  if (!toggleBtn || !trialsContainer) return;

  toggleBtn.addEventListener('click', function() {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      // Expand
      trialsContainer.style.maxHeight = '1000px';
      trialsContainer.style.opacity = '1';
      trialsContainer.style.marginTop = '2rem';
      toggleText.textContent = 'See Less';
      toggleIcon.classList.remove('fa-chevron-down');
      toggleIcon.classList.add('fa-chevron-up');
      
      // Play all videos when expanded
      setTimeout(function() {
        lightbulbVideos.forEach(function(video) {
          var p = video.play();
          if (p && typeof p.then === 'function') { p.catch(function(){}); }
        });
      }, 300);
    } else {
      // Collapse
      trialsContainer.style.maxHeight = '0';
      trialsContainer.style.opacity = '0';
      trialsContainer.style.marginTop = '0';
      toggleText.textContent = 'Show Trials';
      toggleIcon.classList.remove('fa-chevron-up');
      toggleIcon.classList.add('fa-chevron-down');
      
      // Pause all videos when collapsed
      lightbulbVideos.forEach(function(video) {
        video.pause();
        video.currentTime = 0;
      });
    }
  });

  // Restart button functionality - play all videos at once
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      lightbulbVideos.forEach(function(video) {
        video.currentTime = 0;
        var p = video.play();
        if (p && typeof p.then === 'function') { p.catch(function(){}); }
      });
    });
  }
});

