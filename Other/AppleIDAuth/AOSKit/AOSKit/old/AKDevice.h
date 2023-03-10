///* Generated by RuntimeBrowser
//   Image: /System/Library/PrivateFrameworks/AuthKit.framework/Versions/A/AuthKit
// */
//
//@interface AKDevice : NSObject <NSCopying, NSSecureCoding> {
//    NSString * _MLBSerialNumber;
//    NSString * _ROMAddress;
//    NSNumber * _backingColor;
//    NSString * _color;
//    NSNumber * _coverGlassColor;
//    NSString * _enclosureColor;
//    NSNumber * _housingColor;
//    unsigned long long  _linkType;
//    NSLocale * _locale;
//    NSString * _modelNumber;
//    NSString * _provisioningDeviceIdentifier;
//    NSString * _serverFriendlyDescription;
//    BOOL  _shouldUpdateBackingColor;
//    BOOL  _shouldUpdateColor;
//    BOOL  _shouldUpdateCoverGlassColor;
//    BOOL  _shouldUpdateEnclosureColor;
//    BOOL  _shouldUpdateHousingColor;
//    BOOL  _shouldUpdateLocale;
//    BOOL  _shouldUpdateMLBSerialNumber;
//    BOOL  _shouldUpdateModelNumber;
//    BOOL  _shouldUpdateProvisioningDeviceIdentifier;
//    BOOL  _shouldUpdateROMAddress;
//    BOOL  _shouldUpdateServerFriendlyDescription;
//    BOOL  _shouldUpdateUniqueDeviceIdentifier;
//    struct os_unfair_lock_s {
//        unsigned int _os_unfair_lock_opaque;
//    }  _unfairLock;
//    NSString * _uniqueDeviceIdentifier;
//}
//
////@property (nonatomic, copy) NSString *MLBSerialNumber;
////@property (nonatomic, copy) NSString *ROMAddress;
////@property (nonatomic, copy) NSNumber *backingColor;
////@property (nonatomic, copy) NSString *color;
////@property (nonatomic, copy) NSNumber *coverGlassColor;
////@property (nonatomic, copy) NSString *enclosureColor;
////@property (nonatomic, copy) NSNumber *housingColor;
////@property (nonatomic, readonly) NSString *integratedCircuitCardIdentifier;
////@property (nonatomic, readonly) NSString *internationalMobileEquipmentIdentity;
////@property (nonatomic, readonly) NSString *internationalMobileEquipmentIdentity2;
////@property (nonatomic, readonly) BOOL isBiometricAuthCapable;
////@property (nonatomic, readonly) BOOL isFaceIDCapable;
////@property (nonatomic, readonly) BOOL isInCircle;
////@property (nonatomic, readonly) BOOL isInternalBuild;
////@property (nonatomic, readonly) BOOL isMultiUserMode;
////@property (nonatomic, readonly) BOOL isProtectedWithPasscode;
////@property (nonatomic, readonly) BOOL isUnlocked;
////@property (setter=setLinkType:, nonatomic) unsigned long long linkType;
////@property (nonatomic, readonly) NSString *localUserUUID;
////@property (nonatomic, copy) NSLocale *locale;
////@property (nonatomic, readonly) NSString *mobileEquipmentIdentifier;
////@property (nonatomic, copy) NSString *modelNumber;
////@property (nonatomic, readonly) NSString *phoneNumber;
////@property (nonatomic, copy) NSString *provisioningDeviceIdentifier;
////@property (nonatomic, readonly) NSString *serialNumber;
////@property (nonatomic, readonly) NSData *serializedData;
////@property (nonatomic, copy) NSString *serverFriendlyDescription;
////@property (nonatomic, copy) NSString *uniqueDeviceIdentifier;
////@property (nonatomic, readonly) NSString *userChosenName;
////@property (nonatomic, readonly) NSString *userFullName;
//
//+ (id)_buildNumber;
//+ (long long)_currentDeviceAuthenticationMode;
//+ (id)_dataForNVRAMKey:(id)arg1;
//+ (id)_generateAuthInfoKey:(const char *)arg1;
//+ (id)_hardwareModel;
//+ (id)_hexAddressDescriptionForData:(id)arg1;
//+ (id)_nvramStyleDescriptionForData:(id)arg1;
//+ (id)_osName;
//+ (id)_osVersion;
//+ (id)_serverFriendlyDeviceColorForArea:(struct __CFString { }*)arg1;
//+ (id)_systemVersionDictionary;
//+ (id)activeIDSPeerDevice;
//+ (id)currentDevice;
//+ (long long)currentDeviceAuthenticationMode;
//+ (long long)currentDeviceAuthenticationModeForAuthContext:(id)arg1;
//+ (id)deviceSpecificLocalizedStringWithKey:(id)arg1;
//+ (id)deviceSpecificLocalizedStringWithKey:(id)arg1 inTable:(id)arg2;
//+ (id)deviceWithSerializedData:(id)arg1;
//+ (BOOL)hasUniqueDeviceIdentifier;
//+ (BOOL)supportsSecureCoding;
//+ (id)systemContainerCacheURL;
//+ (id)systemContainerURL;
//
////- (void).cxx_destruct;
//- (id)MLBSerialNumber;
//- (id)ROMAddress;
//- (void)_setShouldUpdateToValue:(BOOL)arg1;
//- (id)_volumeGroupUUID;
//- (id)backingColor;
//- (id)color;
////- (id)copyWithZone:(struct _NSZone { }*)arg1;
//- (id)coverGlassColor;
//- (BOOL)currentUserIsLocal;
//- (id)description;
//- (id)enclosureColor;
//- (void)encodeWithCoder:(id)arg1;
//- (id)housingColor;
//- (id)init;
//- (id)initWithCoder:(id)arg1;
//- (id)integratedCircuitCardIdentifier;
//- (id)internationalMobileEquipmentIdentity;
//- (id)internationalMobileEquipmentIdentity2;
//- (BOOL)isBiometricAuthCapable;
//- (BOOL)isFaceIDCapable;
//- (BOOL)isInCircle;
//- (BOOL)isInternalBuild;
//- (BOOL)isMultiUserMode;
//- (BOOL)isProtectedWithPasscode;
//- (BOOL)isUnlocked;
//- (unsigned long long)linkType;
//- (id)localUserUUID;
//- (id)locale;
//- (id)mobileEquipmentIdentifier;
//- (id)modelNumber;
//- (id)phoneNumber;
//- (id)provisioningDeviceIdentifier;
//- (id)serialNumber;
//- (id)serializedData;
//- (id)serverFriendlyDescription;
//- (void)setBackingColor:(id)arg1;
//- (void)setColor:(id)arg1;
//- (void)setCoverGlassColor:(id)arg1;
//- (void)setEnclosureColor:(id)arg1;
//- (void)setHousingColor:(id)arg1;
//- (void)setLinkType:(unsigned long long)arg1;
//- (void)setLocale:(id)arg1;
//- (void)setMLBSerialNumber:(id)arg1;
//- (void)setModelNumber:(id)arg1;
//- (void)setProvisioningDeviceIdentifier:(id)arg1;
//- (void)setROMAddress:(id)arg1;
//- (void)setServerFriendlyDescription:(id)arg1;
//- (void)setUniqueDeviceIdentifier:(id)arg1;
//- (id)uniqueDeviceIdentifier;
//- (id)userChosenName;
//- (id)userFullName;
//
//@end
