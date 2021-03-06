import { isIOS, PropertyChangeData } from "@nativescript/core";
import { ObservableArray } from "@nativescript/core/data/observable-array";
import { booleanConverter, GridLayout, TextField } from "@nativescript/core/ui";
import { Builder } from "@nativescript/core/ui/";
import { Property } from "@nativescript/core/ui/core/view";
import * as enums from "@nativescript/core/ui/enums";
import { AnimationCurve } from "@nativescript/core/ui/enums";

let unfilteredSource: Array<any> = [];
let filtering: boolean = false;
export const listWidthProperty = new Property<FilterableListpicker, string>({
	name: "listWidth",
	defaultValue: "300"
});
export const listHeightProperty = new Property<FilterableListpicker, string>({
	name: "listHeight",
	defaultValue: "300"
});
export const yPos = new Property<FilterableListpicker, string>({
	name: "yPos",
	defaultValue: "0"
});
export const headingTitleProperty = new Property<FilterableListpicker, string>({
	name: "headingTitle",
	defaultValue: undefined
});
export const enableSearchProperty = new Property<FilterableListpicker, boolean>({
	name: "enableSearch",
	defaultValue: false,
	valueConverter: booleanConverter
});
export const showCancelProperty = new Property<FilterableListpicker, boolean>({
	name: "showCancel",
	defaultValue: true,
	valueConverter: booleanConverter
});
export const dimmerColorProperty = new Property<FilterableListpicker, string>({
	name: "dimmerColor",
	defaultValue: "rgba(0,0,0,0.8)"
});
export const blurProperty = new Property<FilterableListpicker, string>({
	name: "blur",
	defaultValue: "none"
});
export const focusOnShowProperty = new Property<FilterableListpicker, boolean>({
	name: "focusOnShow",
	defaultValue: false
});
export const hideFilterProperty = new Property<FilterableListpicker, boolean>({
	name: "hideFilter",
	defaultValue: false
});
export const hintTextProperty = new Property<FilterableListpicker, string>({
	name: "hintText",
	defaultValue: "Enter text to filter..."
});
export const parentHandlesHideProperty = new Property<FilterableListpicker, boolean>({
	name: "parentHandlesHide",
	defaultValue: false,
	valueConverter: booleanConverter
});
export const sourceProperty = new Property<FilterableListpicker, ObservableArray<any>>({
	name: "source",
	defaultValue: undefined,
	affectsLayout: true,
	valueChanged: (target, oldValue, newValue) => {
		if (!filtering) {
			while (unfilteredSource.length) unfilteredSource.pop();
			newValue.forEach(element => {
				unfilteredSource.push(element);
			});
		}
	}
});

export class FilterableListpicker extends GridLayout {
	constructor() {
		super();
		this._searchFilter = this._searchFilterFn.bind(this);
	}

	onLoaded() {
		super.onLoaded();
		let innerComponent = Builder.parse(`
          <GridLayout id="dc_flp_container" class="flp-container" visibility="collapse" loaded="{{loadedContainer}}">
              <StackLayout width="100%" height="100%"></StackLayout>
              <GridLayout width="{{listWidth}}" verticalAlignment="middle" rows="auto, auto, auto, auto" id="dc_flp" class="flp-list-container" loaded="{{loadedInnerContainer}}">
                  <Label id="headerTitle" row="0" text="{{headingTitle}}" class="flp-heading-title" visibility="{{headingTitle ? 'visible' : 'collapse'}}"></Label>
                  <TextField hint="{{hintText}}" row="1" text="{{filterText}}" id="filterTextField" class="flp-hint-field" visibility="{{enableSearch ? 'visible' : 'collapse'}}" loaded="{{loadedTextField}}"></TextField>
                  <ListView id="filterLV" items="{{ source }}" row="2" height="{{listHeight}}" itemTap="{{choose}}" class="flp-listview" itemTemplateSelector="$index">
                      <ListView.itemTemplate>
                          <StackLayout id="{{id}}" class="flp-row" locked="{{ locked, locked }}">
                              <GridLayout columns="auto, *, auto" visibility="{{title ? 'visible' : 'collapse'}}" class="{{ !locked ? 'flp-row-container' : 'flp-row-container locked' }}">
                                  <Image src="{{image ? image : null}}" width="30" visibility="{{image ? 'visible' : 'collapse'}}" stretch="aspectFit" rowSpan="2" class="flp-image" tintColor="{{ imageTintColor }}"></Image>
                                  <StackLayout class="flp-title-container" col="1" verticalAlignment="middle">
																			<GridLayout rows="auto" columns="*, auto">
																				<Label id="listItemTitle" row="0" col="0" text="{{title ? title : ''}}" textWrap="true" class="{{ !selected ? 'flp-title' : 'flp-title selected' }}"></Label>
																				<Label row="0" col="1" text="{{subTitle ? subTitle : ''}}" textWrap="false" class="flp-sub-title" visibility="{{subTitle ? 'visible' : 'collapse'}}"></Label>
																			</GridLayout>
                                      <Label text="{{description ? description : ''}}" textWrap="true" visibility="{{description ? 'visible' : 'collapse'}}" class="{{ !selected ? 'flp-description' : 'flp-description selected'}}"></Label>
																	</StackLayout>
																	<StackLayout row="0" col="2" width="3" borderRadius="2" backgroundColor="{{markerColor, markerColor}}" visibility="{{markerColor ? 'visible' : 'collapse'}}" margin="-5 -10" padding="-5 0"/>
                              </GridLayout>
                              <Label text="{{$value}}" textWrap="true" class="flp-no-title" visibility="{{title ? 'collapse' : 'visible'}}"></Label>
                          </StackLayout>
                      </ListView.itemTemplate>
                  </ListView>
                  <StackLayout id="doneContainer" row="3" class="flp-cancel-container" visibility="{{showCancel ? 'visible' : 'collapse'}}">
                      <Button text="Done" tap="{{cancel, cancel}}" verticalAlignment="middle" class="flp-btn-cancel"></Button>
                  </StackLayout>
              </GridLayout>
          </GridLayout>`);
		innerComponent.bindingContext = this;
		this.addChild(innerComponent);
	}
	public static canceledEvent = "canceled";
	public static itemTappedEvent = "itemTapped";
	public source: any;
	public id: any;
	public headingTitle: string;
	public dimmerColor: any;
	public hintText: any;
	public hideFilter: any;
	public enableSearch: any;
	public parentHandlesHide: boolean;
	public blur: any;
	public markerColor: string;
	public imageTintColor: string;
	private blurView: any = false;
	public focusOnShow: any;
	public yPos: string;
	private _container: GridLayout;
	private _picker: GridLayout;
	private _textField: TextField;
	private _searchFilter: (data: any) => void;
	private _isAutocomplete: boolean = false;
	private _suggestions: any;

	visibility: any = enums.Visibility.collapse;

	loadedContainer(args) {
		this._container = <GridLayout>args.object;
	}

	loadedInnerContainer(args) {
		this._picker = <GridLayout>args.object;
	}

	autocomplete(fn: Function) {
		if (!this.isAutocomplete) return;
		if (typeof fn !== "function") throw "[FilterableListPicker]: autotcomplete params must be a Function type !";

		/**
		 * Populate sources with suggestions if is defined is usefull if we have a most use list
		 * for the moment user can't search into suggestion .. writing into Textfield will active autocomplete
		 * */

		if (!this.source) this.source = [];

		// Copy suggestion list to bind it when Textfield is empty
		this._suggestions = this.source;

		// bind custome autocomplete function
		this._textField.on("textChange", (data: PropertyChangeData) => {
			if (!data.value && this._suggestions.length > 0) {
				this.set("source", this._suggestions);
				this.notifyPropertyChange("source", this._suggestions);
				console.log(this._suggestions);
				return;
			}
			fn(data);
		});
	}

	loadedTextField(args) {
		this._textField = <TextField>args.object;
	}

	public choose(args) {
		const lv = this.getViewById("filterLV") as any;
		const selectedItem = this.source[args.index];
		const item = args.view;
		if (item.locked === true) {
			return;
		}
		this.notify({
			eventName: "itemTapped",
			object: this,
			item,
			selectedItem
		});
		if (!this.parentHandlesHide) {
			setTimeout(() => {
				this.hide();
			}, 100);
		}
	}

	public setSelected(indx) {
		const selectedItem = this.source[indx];
		this.notify({
			eventName: "itemUpdated",
			object: this,
			selectedItem
		});
	}

	public cancel(args) {
		const selectedItem = this.source[args.index];
		this.notify({
			eventName: "canceled",
			object: this,
			selectedItem
		});
		this.hide();
	}

	public hide() {
		if (this.enableSearch) {
			if (this._textField.dismissSoftInput) this._textField.dismissSoftInput();
			this._textField.text = "";
		}
		if (this.blurView) {
			this.page.nativeView.UIView.animateWithDurationAnimationsCompletion(
				0.3,
				() => {
					this.blurView.effect = null;
				},
				() => {
					this.blurView.removeFromSuperview();
				}
			);
		} else {
			this._container
				.animate({
					opacity: 0,
					duration: 200
				})
				.then(
					_ => {},
					err => {}
				);
		}

		if (this.enableSearch) {
			// cleanup event when closing
			this._textField.off("textChange", this._searchFilter);
		}

		return this._picker
			.animate({
				scale: { x: 0.7, y: 0.7 },
				opacity: 0,
				duration: 400,
				curve: AnimationCurve.cubicBezier(0.1, 0.1, 0.1, 1)
			})
			.then(
				() => {
					this.visibility = enums.Visibility.collapse;
					this._container.visibility = "collapse";
				},
				err => {}
			);
	}

	public show() {
		this.visibility = enums.Visibility.visible;
		this._container.visibility = "visible";

		this.source = unfilteredSource.filter(i => true);
		if (isIOS && this.blur && this.blur !== "none") {
			let iosView: any = this._container.ios;
			let effectView = this.page.nativeView.UIVisualEffectView.alloc().init();
			effectView.frame = this.page.nativeView.CGRectMake(0, 0, iosView.bounds.size.width, iosView.bounds.size.height);
			effectView.autoresizingMask =
				this.page.nativeView.UIViewAutoresizing.FlexibleWidth | this.page.nativeView.UIViewAutoresizing.FlexibleHeight;
			this.blurView = effectView;
			iosView.addSubview(effectView);
			iosView.sendSubviewToBack(effectView);
			this.page.nativeView.UIView.animateWithDurationAnimationsCompletion(
				0.3,
				() => {
					let theme = this.page.nativeView.UIBlurEffectStyle.Dark;
					if (this.blur === "light") theme = this.page.nativeView.UIBlurEffectStyle.Light;
					effectView.effect = this.page.nativeView.UIBlurEffect.effectWithStyle(theme);
				},
				() => {
					// the animation is complete.
				}
			);
		} else {
			this._container.opacity = 0;
			this._container.backgroundColor = this.dimmerColor;
			this._container
				.animate({
					opacity: 1,
					duration: 200
				})
				.then(
					_ => {},
					err => {}
				);
		}

		this._picker.scaleX = 0.7;
		this._picker.scaleY = 0.7;
		this._picker.opacity = 0;
		this._picker
			.animate({
				scale: { x: 1, y: 1 },
				translate: { x: 0, y: parseFloat(this.yPos) },
				opacity: 1,
				duration: 400,
				curve: AnimationCurve.cubicBezier(0.1, 0.1, 0.1, 1)
			})
			.then(
				_ => {},
				err => {}
			);

		if (this.enableSearch) {
			if (JSON.parse(this.focusOnShow)) this._textField.focus();
			this._textField.on("textChange", this._searchFilter);
		}
	}

	get isAutocomplete(): boolean {
		return this._isAutocomplete;
	}

	set isAutocomplete(val: boolean) {
		if (val === false) {
			// remve listener for TextField
			console.log(val);
			this._textField.off("textChange");
		}
		this._isAutocomplete = val;
	}

	private _searchFilterFn(data: any) {
		filtering = true;
		this.source = unfilteredSource.filter(item => {
			if (item.title) {
				return item.title.toLowerCase().indexOf(data.value.toLowerCase()) !== -1;
			} else {
				return item.toLowerCase().indexOf(data.value.toLowerCase()) !== -1;
			}
		});
		filtering = false;
	}
}

listWidthProperty.register(FilterableListpicker);
listHeightProperty.register(FilterableListpicker);
yPos.register(FilterableListpicker);
headingTitleProperty.register(FilterableListpicker);
enableSearchProperty.register(FilterableListpicker);
showCancelProperty.register(FilterableListpicker);
dimmerColorProperty.register(FilterableListpicker);
focusOnShowProperty.register(FilterableListpicker);
hideFilterProperty.register(FilterableListpicker);
blurProperty.register(FilterableListpicker);
hintTextProperty.register(FilterableListpicker);
parentHandlesHideProperty.register(FilterableListpicker);
sourceProperty.register(FilterableListpicker);

export interface SourcesInterface {
	title: string;
	image?: any;
	description?: string;
	locked?: boolean;
	selected?: boolean;
	markerColor?: string;
	imageTintColor?: string;
}

export class SourcesDataItem implements SourcesInterface {
	title: string;
	subTitle?: string;
	image?: any;
	description?: string;
	locked?: boolean;
	selected?: boolean;
	markerColor?: string;
	imageTintColor?: string;

	constructor(
		title: string,
		subTitle?: string,
		image?: any,
		description?: string,
		locked?: boolean,
		selected?: boolean,
		markerColor: string = "gray",
		imageTintColor?: "#005777"
	) {
		this.title = title;
		this.subTitle = subTitle;
		this.image = image;
		this.description = description;
		this.locked = locked;
		this.selected = selected;
		this.markerColor = markerColor;
		this.imageTintColor = imageTintColor;
	}
}
