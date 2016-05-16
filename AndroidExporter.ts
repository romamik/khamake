"use strict";

import * as fs from 'fs-extra';
import * as path from 'path';
import {Asset} from './Asset';
import {KhaExporter} from './KhaExporter';
import {convert} from './Converter';
import {executeHaxe} from './Haxe';
import {Options} from './Options';
import {exportImage} from './ImageTool';
import {writeHaxeProject} from './HaxeProject';

function findIcon(from: string) {
	if (fs.existsSync(path.join(from, 'icon.png'))) return path.join(from, 'icon.png');
	else return path.join(__dirname, '..', '..', 'Kore', 'Tools', 'kraffiti', 'ball.png');
}

export class AndroidExporter extends KhaExporter {
	parameters: Array<string>;
	
	constructor(options: Options) {
		super(options);
		this.addSourceDirectory(path.join(options.kha, 'Backends', 'Android'));
	}

	sysdir() {
		return 'android';
	}

	backend() {
		return "Android";
	}

	async exportSolution(name: string, _targetOptions: any, defines: Array<string>): Promise<void> {
		const safename = name.replace(/ /g, '-');

		defines.push('no-compilation');
		defines.push('sys_' + this.options.target);
		defines.push('sys_g1');
		defines.push('sys_g2');
		defines.push('sys_g3');
		defines.push('sys_g4');
		defines.push('sys_a1');

		const options = {
			from: this.options.from,
			to: path.join(this.sysdir(), safename),
			sources: this.sources,
			libraries: this.libraries,
			defines: defines,
			parameters: this.parameters,
			haxeDirectory: this.options.haxe,
			system: this.sysdir(),
			language: 'java',
			width: this.width,
			height: this.height,
			name: name
		};
		writeHaxeProject(this.options.to, options);

		this.exportAndroidStudioProject(name, _targetOptions, this.options.from);

		await executeHaxe(this.options.to, this.options.haxe, ['project-' + this.sysdir() + '.hxml']);
	}

	exportAndroidStudioProject(name, _targetOptions, from) {
		let safename = name.replaceAll(' ', '-');
		this.safename = safename;

		let targetOptions = {
			package: 'com.ktxsoftware.kha',
			screenOrientation: 'sensor'
		};
		if (_targetOptions != null && _targetOptions.android != null) {
			let userOptions = _targetOptions.android;
			if (userOptions.package != null) targetOptions.package = userOptions.package;
			if (userOptions.screenOrientation != null) targetOptions.screenOrientation = userOptions.screenOrientation;
		}

		let indir = path.join(__dirname, 'Data', 'android');
		let outdir = path.join(this.options.to, this.sysdir(), safename);

		fs.copySync(path.join(indir, 'build.gradle'), path.join(outdir, 'build.gradle'));
		fs.copySync(path.join(indir, 'gradle.properties'), path.join(outdir, 'gradle.properties'));
		fs.copySync(path.join(indir, 'gradlew'), path.join(outdir, 'gradlew'));
		fs.copySync(path.join(indir, 'gradlew.bat'), path.join(outdir, 'gradlew.bat'));
		fs.copySync(path.join(indir, 'settings.gradle'), path.join(outdir, 'settings.gradle'));

		let nameiml = fs.readFileSync(path.join(indir, 'name.iml'), {encoding: 'utf8'});
		nameiml = nameiml.replace(/{name}/g, safename);
		fs.writeFileSync(path.join(outdir, safename + '.iml'), nameiml, {encoding: 'utf8'});

		fs.copySync(path.join(indir, 'app', 'proguard-rules.pro'), path.join(outdir, 'app', 'proguard-rules.pro'));

		let gradle = fs.readFileSync(path.join(indir, 'app', 'build.gradle'), {encoding: 'utf8'});
		gradle = gradle.replace(/{package}/g, targetOptions.package);
		fs.writeFileSync(path.join(outdir, 'app', 'build.gradle'), gradle, {encoding: 'utf8'});

		let appiml = fs.readFileSync(path.join(indir, 'app', 'app.iml'), {encoding: 'utf8'});
		appiml = appiml.replace(/{name}/g, safename);
		fs.writeFileSync(path.join(outdir, 'app', 'app.iml'), appiml, {encoding: 'utf8'});

		fs.ensureDirSync(path.join(outdir, 'app', 'src'));
		//fs.emptyDirSync(path.join(outdir, 'app', 'src'));

		// fs.copySync(path.join(indir, 'main', 'AndroidManifest.xml'), path.join(outdir, 'app', 'src', 'main', 'AndroidManifest.xml'));
		let manifest = fs.readFileSync(path.join(indir, 'main', 'AndroidManifest.xml'), {encoding: 'utf8'});
		manifest = manifest.replace(/{package}/g, targetOptions.package);
		manifest = manifest.replace(/{screenOrientation}/g, targetOptions.screenOrientation);
		fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main'));
		fs.writeFileSync(path.join(outdir, 'app', 'src', 'main', 'AndroidManifest.xml'), manifest, {encoding: 'utf8'});

		fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'values'));
		let strings = fs.readFileSync(path.join(indir, 'main', 'res', 'values', 'strings.xml'), {encoding: 'utf8'});
		strings = strings.replace(/{name}/g, name);
		fs.writeFileSync(path.join(outdir, 'app', 'src', 'main', 'res', 'values', 'strings.xml'), strings, {encoding: 'utf8'});

		fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-hdpi'));
		exportImage(findIcon(from), path.join(this.options.to, this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-hdpi', "ic_launcher"), new Asset(72, 72), 'png', false);
		fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-mdpi'));
		exportImage(findIcon(from), path.join(this.options.to, this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-mdpi', "ic_launcher"), new Asset(48, 48), 'png', false);
		fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-xhdpi'));
		exportImage(findIcon(from), path.join(this.options.to, this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-xhdpi', "ic_launcher"), new Asset(96, 96), 'png', false);
		fs.ensureDirSync(path.join(outdir, 'app', 'src', 'main', 'res', 'mipmap-xxhdpi'));
		exportImage(findIcon(from), path.join(this.options.to, this.sysdir(), safename, 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', "ic_launcher"), new Asset(144, 144), 'png', false);

		fs.copySync(path.join(indir, 'gradle', 'wrapper', 'gradle-wrapper.jar'), path.join(outdir, 'gradle', 'wrapper', 'gradle-wrapper.jar'));
		fs.copySync(path.join(indir, 'gradle', 'wrapper', 'gradle-wrapper.properties'), path.join(outdir, 'gradle', 'wrapper', 'gradle-wrapper.properties'));

		fs.copySync(path.join(indir, 'idea', 'compiler.xml'), path.join(outdir, '.idea', 'compiler.xml'));
		fs.copySync(path.join(indir, 'idea', 'encodings.xml'), path.join(outdir, '.idea', 'encodings.xml'));
		fs.copySync(path.join(indir, 'idea', 'gradle.xml'), path.join(outdir, '.idea', 'gradle.xml'));
		fs.copySync(path.join(indir, 'idea', 'misc.xml'), path.join(outdir, '.idea', 'misc.xml'));
		fs.copySync(path.join(indir, 'idea', 'runConfigurations.xml'), path.join(outdir, '.idea', 'runConfigurations.xml'));
		fs.copySync(path.join(indir, 'idea', 'vcs.xml'), path.join(outdir, '.idea', 'vcs.xml'));
		fs.copySync(path.join(indir, 'idea', 'copyright', 'profiles_settings.xml'), path.join(outdir, '.idea', 'copyright', 'profiles_settings.xml'));

		let namename = fs.readFileSync(path.join(indir, 'idea', 'name'), {encoding: 'utf8'});
		namename = namename.replace(/{name}/g, name);
		fs.writeFileSync(path.join(outdir, '.idea', '.name'), namename, {encoding: 'utf8'});

		let modules = fs.readFileSync(path.join(indir, 'idea', 'modules.xml'), {encoding: 'utf8'});
		modules = modules.replace(/{name}/g, safename);
		fs.writeFileSync(path.join(outdir, '.idea', 'modules.xml'), modules, {encoding: 'utf8'});
	}

	/*copyMusic(platform, from, to, encoders, callback) {
		Files.createDirectories(this.directory.resolve(this.sysdir()).resolve(to).parent());
		Converter.convert(from, this.directory.resolve(Paths.get(this.sysdir(), this.safename, 'app', 'src', 'main', 'assets', to + '.ogg')), encoders.oggEncoder, function (success) {
			callback([to + '.ogg']);
		});
	}*/

	async copySound(platform, from, to, encoders) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), this.safename, 'app', 'src', 'main', 'assets', to + '.wav'), { clobber: true });
		return [to + '.wav'];
	}

	async copyImage(platform, from, to, asset) {
		let format = await exportImage(from, path.join(this.options.to, this.sysdir(), this.safename, 'app', 'src', 'main', 'assets', to), asset, undefined, false);
		return [to + '.' + format];
	}

	async copyBlob(platform, from, to) {
		fs.copySync(from.toString(), path.join(this.options.to, this.sysdir(), this.safename, 'app', 'src', 'main', 'assets', to), { clobber: true });
		return [to];
	}

	async copyVideo(platform, from, to, encoders) {
		return [to];
	}
}