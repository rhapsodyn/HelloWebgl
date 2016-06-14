(function (DEMO) {
	'use strict';

	var canvasEl, glContext, shaderProgram, vBuffer, cBuffer, elBuffer, vPosAttr, vColorAttr;
	var TIME = {
		deltaTime : 0, 
		startTime : 0,
		totalTime : 0,
		lastFrameTime : 0
	};

	function getShader(shaderText, type) {
		var shader; 

		if (type === 'v') {
			shader = glContext.createShader(glContext.VERTEX_SHADER);
		} else {
			shader = glContext.createShader(glContext.FRAGMENT_SHADER);
		}

		glContext.shaderSource(shader, shaderText);
		glContext.compileShader(shader);

		console.log("shader COMPILE_STATUS: " + glContext.getShaderParameter(shader, glContext.COMPILE_STATUS));
		console.log("shadr info: " + glContext.getShaderInfoLog(shader));

		return shader;
	}

	//camera is fixed
	function setMVP(gl, shaderProgram) {
		var modelMatrix = Matrix.I(4),
			projectionMatrix = makePerspective(45, 4/3, 0.1, 100.0),
			viewMatrix = makeLookAt(0,0,6, 0,0,0, 0,1,0);

		// var mvp = modelMatrix.x(viewMatrix).x(projectionMatrix);
		var mvp = projectionMatrix.x(viewMatrix).x(modelMatrix);
		var pUniform = gl.getUniformLocation(shaderProgram, 'MVP');
		gl.uniformMatrix4fv(pUniform, false, new Float32Array(mvp.flatten()));
	}

	//"rotation" camera
	function setMVP2(gl, shaderProgram) {
		var angleSpeed = 20, // deg / s
			theta = angleSpeed * TIME.totalTime / 1000,
			tanTheta = Math.tan(theta * Math.PI / 360);

		var y = Math.sqrt(1 / (Math.pow(tanTheta, 2) + 1)),
			x = y * tanTheta;

		var modelMatrix = Matrix.I(4),
			projectionMatrix = makePerspective(45, 4/3, 0.1, 100.0),
			viewMatrix = makeLookAt(0,0,6, 0,0,0, x,y,0);

		// var mvp = modelMatrix.x(viewMatrix).x(projectionMatrix);
		var mvp = projectionMatrix.x(viewMatrix).x(modelMatrix);
		var pUniform = gl.getUniformLocation(shaderProgram, 'MVP');
		gl.uniformMatrix4fv(pUniform, false, new Float32Array(mvp.flatten()));
	}

	//"rotation" camera2
	function setMVP3(gl, shaderProgram) {
		var angleSpeed = 20,
			theta = angleSpeed * TIME.totalTime / 1000;

		var rotationMatrix = Matrix.Rotation(theta * Math.PI / 180, $V([0, 1, 0])).ensure4x4();

		// var modelMatrix = Matrix.I(4),
		// 	projectionMatrix = makePerspective(45, 4/3, 0.1, 100.0),
		// 	viewMatrix = makeLookAt(2,4,6, 0,0,0, 0,1,0).x(rotationMatrix);

		//the same result, but different in theory
		var modelMatrix = Matrix.I(4).x(rotationMatrix),
			projectionMatrix = makePerspective(45, 4/3, 0.1, 100.0),
			viewMatrix = makeLookAt(2,4,6, 0,0,0, 0,1,0);


		// var mvp = modelMatrix.x(viewMatrix).x(projectionMatrix);
		var mvp = projectionMatrix.x(viewMatrix).x(modelMatrix);
		var pUniform = gl.getUniformLocation(shaderProgram, 'MVP');
		gl.uniformMatrix4fv(pUniform, false, new Float32Array(mvp.flatten()));
	}

	function prepareShader() {
		//get shader
		var vertexShader = getShader(document.getElementById('v').textContent, 'v'),
			fragmentShader = getShader(document.getElementById('f').textContent, 'f');

		shaderProgram = glContext.createProgram();
		glContext.attachShader(shaderProgram, vertexShader);
		glContext.attachShader(shaderProgram, fragmentShader);
		glContext.linkProgram(shaderProgram);

		console.log("shader program LINK_STATUS: " + glContext.getProgramParameter(shaderProgram, glContext.LINK_STATUS));
		console.log("shader program info: " + glContext.getProgramInfoLog(shaderProgram));

		glContext.useProgram(shaderProgram);
	}

	function setBuffer() {
		//vertices
		vBuffer = glContext.createBuffer();
		glContext.bindBuffer(glContext.ARRAY_BUFFER, vBuffer);

		//a triangle
		var vertices = [
			// Front face
			-1.0, -1.0,  1.0,
			1.0, -1.0,  1.0,
			1.0,  1.0,  1.0,
			-1.0,  1.0,  1.0,

			// Back face
			-1.0, -1.0, -1.0,
			-1.0,  1.0, -1.0,
			1.0,  1.0, -1.0,
			1.0, -1.0, -1.0,

			// Top face
			-1.0,  1.0, -1.0,
			-1.0,  1.0,  1.0,
			1.0,  1.0,  1.0,
			1.0,  1.0, -1.0,

			// Bottom face
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, -1.0,  1.0,
			-1.0, -1.0,  1.0,

			// Right face
			1.0, -1.0, -1.0,
			1.0,  1.0, -1.0,
			1.0,  1.0,  1.0,
			1.0, -1.0,  1.0,

			// Left face
			-1.0, -1.0, -1.0,
			-1.0, -1.0,  1.0,
			-1.0,  1.0,  1.0,
			-1.0,  1.0, -1.0
		];

		glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(vertices), glContext.STATIC_DRAW);
		vPosAttr = glContext.getAttribLocation(shaderProgram, 'vPos');
	  	glContext.enableVertexAttribArray(vPosAttr);

	  	//colors
	  	cBuffer = glContext.createBuffer();
	  	glContext.bindBuffer(glContext.ARRAY_BUFFER, cBuffer);

	  	var colors = [
	  		1,1,1, 0.9,0.9,0.9, 0.8,0.8,0.8, 0.7,0.7,0.7,
	  		0,1,0, 0,0.9,0, 0,0.8,0, 0,0.7,0,
	  		0,0,1, 0,0,0.9, 0,0,0.7, 0,0,0.5,
	  		0,1,1, 0,0.8,0.8, 0,0.6,0.6, 0,0.4,0.4,
	  		1,0,1, 0.9,0,0.9, 0.7,0,0.7, 0.5,0,0.5,
	  		1,1,0, 0.8,0.8,0, 0.7,0.7,0, 0.5,0.5,0
	  	];

	  	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(colors), glContext.STATIC_DRAW);
	  	vColorAttr = glContext.getAttribLocation(shaderProgram, 'vColor');
	  	glContext.enableVertexAttribArray(vColorAttr);

	  	//elems
	  	elBuffer = glContext.createBuffer();
	  	glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, elBuffer);

	  	var indices = [
	  		0,1,2,  2,3,0,
	  		4,5,6,  6,7,4,
		    8,9,10, 10,11,8,
		    12,13,14,  14,15,12,
		    16,17,18,  18,19,16,
		    20,21,22,  22,23,20
	  	];

	  	glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), glContext.STATIC_DRAW)
	}

	function draw() {
		var now = Date.now();
		TIME.deltaTime = now - TIME.lastFrameTime;
		TIME.lastFrameTime = now;
		TIME.totalTime = now - TIME.startTime;

		glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

		glContext.bindBuffer(glContext.ARRAY_BUFFER, vBuffer);
		glContext.vertexAttribPointer(vPosAttr, 3, glContext.FLOAT, false, 0, 0);

		glContext.bindBuffer(glContext.ARRAY_BUFFER, cBuffer);
		glContext.vertexAttribPointer(vColorAttr, 3, glContext.FLOAT, false, 0, 0);

		glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, elBuffer);

		setMVP3(glContext, shaderProgram);
		
		// glContext.drawArrays(glContext.TRIANGLES, 0, 3);		
		glContext.drawElements(glContext.TRIANGLES, 36, glContext.UNSIGNED_SHORT, 0);
	}

	function renderFrame() {
		requestAnimationFrame(renderFrame);

		draw();
	}


	DEMO.init = function (canvas) {
		canvasEl = canvas;
		glContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

		//set and clear
		glContext.viewport(0, 0, canvasEl.width, canvasEl.height);
		glContext.clearColor(0.7, 0.7, 0.7, 1.0);
		glContext.clearDepth(1.0);
		glContext.enable(glContext.DEPTH_TEST);
		glContext.depthFunc(glContext.LEQUAL);
	};

	DEMO.run = function () {
		prepareShader();
		setBuffer();

		var now = Date.now();
		TIME.startTime = now;
		TIME.lastFrameTime = now;
		renderFrame();
	}
})(window.DEMO = {});